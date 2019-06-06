import '@babel/polyfill'
import assert from 'assert'
import qs from 'querystring'
import _ from 'lodash'
import bodyParser from 'body-parser'
import cors from 'cors'
import debug from '@watchmen/debug'
import {webHelpr} from '@watchmen/web-helpr'
import config from 'config'
import express from 'express'
import session from 'express-session'
import proxy from 'express-http-proxy'
import {getClient, getContext, getAuthUrl, getLogoutUrl} from './helper'

const dbg = debug(__filename)

const tokenKey = 'session.tokens'
const ctxKey = 'session.ctx'
const authRedirect = config.get('oauth.client.redirect.auth')
const userAgent = config.get('userAgent')
const responseDecorator = _.get(config, 'api.responseDecorator')

process.on('unhandledRejection', err => {
	dbg('unhandled-rejection: %o', err)
	process.exit(1)
})

export default async function({app, sessionStrategy} = {}) {
	dbg('session-strategy=%o', sessionStrategy)
	let store
	if (sessionStrategy) {
		const {getConstructor, options} = sessionStrategy // <-- required format for sessionStrategy
		assert(getConstructor && options, 'getConstructor and options required for sessionStrategy')
		const ctor = getConstructor(session)
		store = new ctor(options)
	} else {
		dbg('WARNING: no sessionStrategy arg provided, defaulting to in-memory...')
		dbg('---> see: https://github.com/expressjs/session#sessionoptions')
	}

	const client = await getClient()

	app = app || express()

	app.use(
		session({
			store,
			secret: config.get('session.secret'),
			resave: false,
			saveUninitialized: false
		})
	)

	// calls to /proxy/... will pass thru after appending token obtained from session
	app.use(
		'/proxy',
		proxy(config.get('api.url'), {
			preserveReqSession: true,
			proxyReqOptDecorator(proxyReqOpts, srcReq) {
				// dbg('proxy: headers=%o', srcReq.headers)
				const tokens = _.get(srcReq, tokenKey)
				if (tokens) {
					proxyReqOpts.headers.Authorization = `Bearer ${tokens.access_token}`
				} else {
					dbg('proxy-req-opt-decorator: warning, unable to obtain token from session...')
				}

				proxyReqOpts.session = null
				return proxyReqOpts
			},
			...(responseDecorator && {
				userResDecorator: (res, _data) => {
					const data = JSON.parse(_data.toString('utf8'))
					dbg('user-res-decorator: data=%o', data)
					return {...responseDecorator, data}
				}
			}),
			// userResDecorator(res, _data) {
			// 	const data = JSON.parse(_data.toString('utf8'))
			// 	dbg('user-res-decorator: data=%o', data)
			// 	return {...responseDecorator, data}
			// },
			proxyErrorHandler(err, res, next) {
				dbg('proxy-error-handler: err=%o', err)
				next(err)
			}
		})
	)

	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({extended: true}))
	app.use(cors())
	app.use((req, res, next) => {
		// checkmarx complaint?
		res.setHeader('Content-Security-Policy', 'default-src "none"; connect-src "self" https:;')
		next()
	})

	app.get('/', (req, res) => {
		webHelpr.dbgReq({dbg, req})
		const isActive = _.get(req, tokenKey) !== undefined
		res.send({
			isActive,
			...responseDecorator
		})
	})

	app.get('/login', async (req, res) => {
		const context = getContext()
		_.set(req, ctxKey, context)

		const url = await getAuthUrl({client, context})

		dbg('/login: url=%o', url)
		res.redirect(url)
	})

	app.get('/auth/cb', async (req, res) => {
		/* eslint-disable camelcase */
		webHelpr.dbgReq({dbg, req})
		const params = client.callbackParams(req)
		const ctx = _.get(req, ctxKey)
		delete req[ctxKey]
		dbg('/auth/cb: params=%o, ctx=%o', params, ctx)
		const tokens = await client.callback(authRedirect, params, ctx)
		dbg('/auth/cb: tokens=%o', tokens)
		_.set(req, tokenKey, tokens)
		const {id_token, access_token, refresh_token} = tokens
		const {redirect, includeAccessToken, includeRefreshToken} = userAgent
		const map = {
			id_token,
			...(includeAccessToken && {access_token}),
			...(includeRefreshToken && {refresh_token})
		}
		const url = `${redirect.auth}?${qs.stringify(map)}`
		dbg('/auth/cb: redirect=%o', url)
		res.redirect(url)
	})

	app.get('/logout', async (req, res) => {
		const context = _.get(req, ctxKey)
		const hint = _.get(req, `${tokenKey}.id_token`)
		const url = await getLogoutUrl({client, context, hint})
		dbg('/logout: url=%o', url)
		res.redirect(url)
	})

	app.get('/logout/cb', async (req, res) => {
		webHelpr.dbgReq({dbg, req})
		req.session.destroy()
		res.redirect(userAgent.redirect.logout)
	})

	// eslint-disable-next-line no-unused-vars
	app.use((err, req, res, next) => {
		dbg('default error handler: err:\n%j', err)
		dbg('default error handler: stack:\n%j', err.stack)

		res.send({
			name: err.name,
			message: err.message
		})
	})

	return app
}
