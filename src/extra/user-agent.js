import express from 'express'
import debug from '@watchmen/debug'
import {stringify} from '@watchmen/helpr'
import config from 'config'
import _ from 'lodash'
import {parse} from 'himalaya'
import jwt from 'jsonwebtoken'
import {webHelpr} from '@watchmen/web-helpr'
import proxy from 'express-http-proxy'

const dbg = debug(__filename)
const userKey = 'session.user'

const proxyPath = config.get('userAgent.proxyPath')
const clientUrl = config.get('oauth.client.url')
const authPath = config.get('userAgent.authPath')
const logoutPath = config.get('userAgent.logoutPath')

export default function({decorate}) {
	const router = express.Router()

	router.get('/', (req, res) => {
		webHelpr.dbgReq({dbg, req})
		res.send(decorate({req, data: {message: 'welcome'}}))
	})

	router.use(
		`/${proxyPath}`,
		proxy(clientUrl, {
			preserveReqSession: true,
			proxyReqOptDecorator(proxyReqOpts, srcReq) {
				// dbg('proxy-req-opt-decorator')
				webHelpr.dbgReq({msg: 'proxy-req-opt-decorator', dbg, req: srcReq})
				return proxyReqOpts
			},
			userResDecorator(proxyRes, proxyResData, userReq, userRes) {
				dbg('user-res-decorator: status=%o', userRes.statusCode)
				if (proxyRes.statusCode !== 302) {
					let data = proxyResData.toString('utf8')
					// dbg('user-res-decorator: data=%o', data)
					try {
						data = JSON.parse(data)
					} catch {
						data = {message: 'unable to parse data as json', data: parse(data)}
					}

					dbg('user-res-decorator: data=%s', stringify(data))
					return decorate({data, req: userReq})
				}

				return proxyResData
			},
			proxyErrorHandler(err, res, next) {
				dbg('proxy-error-handler: err=%o', err)
				next(err)
			}
		})
	)

	router.get(`/${authPath}`, (req, res) => {
		webHelpr.dbgReq({dbg, req})
		const data = {
			...getToken(req, 'id_token'),
			...getToken(req, 'access_token'),
			...getToken(req, 'refresh_token')
		}
		const user = _.get(data, 'id_token.decoded')
		user && _.set(req, userKey, user)
		res.send(decorate({req, data: {message: 'session initiated'}}))
	})

	router.get(`/${logoutPath}`, (req, res) => {
		webHelpr.dbgReq({dbg, req})
		req.session.destroy()
		res.send(decorate({req, data: {message: 'session terminated'}}))
	})

	function getToken(req, name) {
		const token = _.get(req, `query.${name}`)
		return token && {[name]: {token, decoded: jwt.decode(token)}}
	}

	return router
}
