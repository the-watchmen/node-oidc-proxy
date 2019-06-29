import qs from 'querystring'
import test from 'ava'
import debug from '@watchmen/debug'
import config from 'config'
import pretty from 'pretty'
import {getFormAction, getCookieAxios} from '../shared/test-helper'
import all from '../shared/run-separate'

const dbg = debug(__filename)
const axios = getCookieAxios()

const issuerUrl = config.get('oauth.issuer.url')

const {usernameField, passwordField, isActionRelative, delegatedUrl} = config.get(
	'test.oauth.issuer'
)

test('tokens', async t => {
	await all
	// startTerminus({
	// 	app: await getUserAgentApp(),
	// 	port: config.get('userAgent.port'),
	// 	name: 'user-agent',
	// 	dbg
	// })

	const proxyPort = config.get('oauth.client.port')

	// startTerminus({
	// 	app: await getProxyApp(),
	// 	port: proxyPort,
	// 	name: 'proxy',
	// 	dbg
	// })

	let result = await axios.get(`http://localhost:${proxyPort}/login`)
	dbg('result.data=%s', pretty(result.data, {ocd: true}))

	const action = getFormAction({html: result.data})

	// from local config to keep out of scm
	//
	const {name, password} = config.get('test.oauth.issuer.user')

	const _action = isActionRelative ? `${delegatedUrl || issuerUrl}${action}` : action
	dbg('action=%o, _action=%o', action, _action)

	result = await axios.post(
		_action,
		// https://github.com/axios/axios/issues/362#issuecomment-234844677
		//
		qs.stringify({
			[usernameField]: name,
			[passwordField]: password,
			view: 'login'
		}),
		{
			headers: {
				'Content-type': 'application/x-www-form-urlencoded'
			},
			// maxRedirects: 3,
			validateStatus(status) {
				dbg('validate-status: status=%o', status)
				return status === 302
			}
		}
	)
	t.is(result.status, 200)
	dbg('result.data=%O', result.data)
})
