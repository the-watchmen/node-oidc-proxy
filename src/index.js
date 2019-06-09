import qs from 'querystring'
import _ from 'lodash'
import bodyParser from 'body-parser'
import cors from 'cors'
import debug from '@watchmen/debug'
import {webHelpr} from '@watchmen/web-helpr'
import config from 'config'
import express from 'express'
import proxy from 'express-http-proxy'
import {getClient, getContext, getAuthUrl, getLogoutUrl} from './helper'

const dbg = debug(__filename)

const tokenKey = 'session.tokens'
const ctxKey = 'session.ctx'
const authRedirect = config.get('oauth.client.redirect.auth')
const userAgent = config.get('userAgent')

process.on('unhandledRejection', err => {
	dbg('unhandled-rejection: %o', err)
	process.exit(1)
})

export default async function() {
	const router = express.Router()

	const client = await getClient()

	router.use(bodyParser.json())
	router.use(bodyParser.urlencoded({extended: true}))
	router.use(cors())
	router.use((req, res, next) => {
		// checkmarx complaint?
		res.setHeader('Content-Security-Policy', 'default-src "none"; connect-src "self" https:;')
		next()
	})

	router.get('/login', async (req, res) => {
		const context = getContext()
		dbg('context=%o', context)
		_.set(req, ctxKey, context)

		const url = await getAuthUrl({client, context})

		dbg('/login: url=%o', decodeURIComponent(url))
		res.redirect(url)
	})

	router.get('/auth/cb', async (req, res) => {
		/* eslint-disable camelcase */
		webHelpr.dbgReq({dbg, req})
		const params = client.callbackParams(req)
		const ctx = _.get(req, ctxKey)
		dbg('/auth/cb: params=%o, ctx=%o', params, ctx)
		delete req[ctxKey]
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

	router.use(
		'/proxy',
		proxy(config.get('api.url'), {
			preserveReqSession: true,
			proxyReqOptDecorator(proxyReqOpts, srcReq) {
				const tokens = _.get(srcReq, tokenKey)
				if (tokens) {
					proxyReqOpts.headers.Authorization = `Bearer ${tokens.access_token}`
				} else {
					dbg('proxy-req-opt-decorator: warning, unable to obtain token from session...')
				}

				proxyReqOpts.session = null
				return proxyReqOpts
			},
			proxyErrorHandler(err, res, next) {
				dbg('proxy-error-handler: err=%o', err)
				next(err)
			}
		})
	)

	router.get('/logout', async (req, res) => {
		const context = _.get(req, ctxKey)
		const hint = _.get(req, `${tokenKey}.id_token`)
		const url = await getLogoutUrl({client, context, hint})
		dbg('/logout: url=%o', url)
		res.redirect(url)
	})

	router.get('/logout/cb', async (req, res) => {
		webHelpr.dbgReq({dbg, req})
		req.session.destroy()
		res.redirect(userAgent.redirect.logout)
	})

	return router
}
