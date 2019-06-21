import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import config from 'config'
import express from 'express'
import session from 'express-session'
import _ from 'lodash'
import getProxyRouter from '../../src'
import getUserAgentRouter from '../../src/helper/user-agent'
import {startTerminus} from './terminus'
import getProviderRouter from './provider'
import getMockRouter from './mock'

const dbg = debug(__filename)

dbg('config=%s', pretty(config))

export default (async function() {
	let app

	app = express()
	app.use(await getProviderRouter())
	startTerminus({
		app,
		port: config.get('oauth.issuer.port'),
		name: 'idp',
		dbg
	})

	app = express()
	let name = 'user-agent'
	app.use(getSession({name}))
	app.use(getUserAgentRouter({decorate}))
	startTerminus({
		app,
		port: config.get('userAgent.port'),
		name,
		dbg
	})

	app = express()
	app.use(getMockRouter())
	startTerminus({
		app,
		port: config.get('test.api.port'),
		name: 'api',
		dbg
	})

	app = express()
	name = 'proxy'
	app.use(getSession({name}))
	app.use(await getProxyRouter())
	startTerminus({
		app,
		port: config.get('oauth.client.port'),
		name,
		dbg
	})
})()

function getSession({name}) {
	return session({
		// https://github.com/expressjs/session#sessionoptions
		store: null,
		secret: config.get('session.secret'),
		resave: false,
		saveUninitialized: false,
		name
	})
}

const userAgent = _.get(config, 'userAgent')
const client = _.get(config, 'oauth.client')

function decorate({data, req}) {
	const user = _.get(req, 'session.user')
	return {
		data,
		user: user || 'not active',
		_links: {
			...(req.path !== '/' && {home: userAgent.url}),
			self: `${userAgent.url}${req.path}`,
			login: `${userAgent.url}/${userAgent.proxyPath}/login`,
			logout: `${userAgent.url}/${userAgent.proxyPath}/logout`,
			api: [
				{
					name: 'people-via-proxy',
					href: `${userAgent.url}/${userAgent.proxyPath}/${client.proxyPath}/people?_limit=3`
				},
				{
					name: 'people-no-proxy',
					href: `${config.api.url}/people`
				}
			]
		}
	}
}
