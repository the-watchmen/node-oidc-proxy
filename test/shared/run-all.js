import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import config from 'config'
import getProxyApp from '../../src'
import {startTerminus} from './terminus'
import getProviderApp from './get-provider'
import getMockApp from './mock-server'
import getUserAgentApp from './get-user-agent'

const dbg = debug(__filename)

dbg('config=%s', pretty(config))

export default (async function() {
	startTerminus({
		app: await getUserAgentApp(),
		port: config.get('userAgent.port'),
		name: 'user-agent',
		dbg
	})
	startTerminus({
		app: await getProviderApp(),
		port: config.get('oauth.issuer.port'),
		name: 'idp',
		dbg
	})
	startTerminus({
		app: getMockApp(),
		port: config.get('test.api.port'),
		name: 'api',
		dbg
	})
	startTerminus({
		app: await getProxyApp(),
		port: config.get('oauth.client.port'),
		name: 'proxy',
		dbg
	})
})()
