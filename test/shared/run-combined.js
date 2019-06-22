import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import config from 'config'
import express from 'express'
import session from 'express-session'
import _ from 'lodash'
import getProxyRouter from '../../src'
import getUserAgentRouter from '../../src/helper/user-agent'
import getMockRouter from '../../src/helper/mock'
import {startTerminus} from '../../src/helper/terminus'
import getProviderRouter from './provider'

const dbg = debug(__filename)

dbg('config=%s', pretty(config))

// show running combined as example to facilitate k8s deployment
//
export default (async function() {
	let app

	// always start idp stand-alone as would be in k8s (e.g. keycloak)
	//
	app = express()
	app.use(await getProviderRouter())
	startTerminus({
		app,
		port: config.get('oauth.issuer.port'),
		name: 'idp',
		dbg
	})

	// combine user-agent, proxy and mock
	//
	app = express()
	app.use(
		session({
			// https://github.com/expressjs/session#sessionoptions
			store: null,
			secret: config.get('session.secret'),
			resave: false,
			saveUninitialized: false
		})
	)

	const userAgentPath = `/${config.get('userAgent.path')}`
	app.get('/', (req, res) => {
		res.redirect(userAgentPath)
	})
	app.use(userAgentPath, getUserAgentRouter({decorate}))
	app.use(`/${config.get('oauth.client.path')}`, await getProxyRouter())
	app.use(`/${config.get('api.path')}`, getMockRouter())

	startTerminus({
		app,
		port: config.get('userAgent.port'),
		name: 'combined',
		dbg
	})
})()

const userAgent = _.get(config, 'userAgent')
const client = _.get(config, 'oauth.client')
const api = _.get(config, 'api')

function decorate({data, req}) {
	const user = _.get(req, 'session.user')
	return {
		data,
		user: user || 'not active',
		_links: {
			...(req.path !== '/' && {home: userAgent.url}),
			self: `${userAgent.url}${req.path}`,
			login: `${userAgent.url}/${userAgent.proxyPath}/${client.path}/login`,
			logout: `${userAgent.url}/${userAgent.proxyPath}/${client.path}/logout`,
			api: [
				{
					name: 'people-via-proxy',
					href: `${userAgent.url}/${userAgent.proxyPath}/${client.path}/${client.proxyPath}/${api.path}/people?_limit=3`
				},
				{
					name: 'people-no-proxy',
					href: `${config.api.url}/people`
				}
			]
		}
	}
}
