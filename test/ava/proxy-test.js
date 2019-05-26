import qs from 'querystring'
import test from 'ava'
import debug from '@watchmen/debug'
import config from 'config'
import pretty from 'pretty'
import {getFormAction, getCookieAxios} from '../shared/test-helper'
import runProxy from '../shared/run-proxy'
import runRedirect from '../shared/run-redirect'

const dbg = debug(__filename)
const axios = getCookieAxios()

const {
	usernameField,
	passwordField,
	isActionRelative,
	url: issuerUrl,
	delegatedUrl
} = config.oauth.issuer
const {port: proxyPort} = config.listener

test('tokens', async t => {
	await runRedirect()
	await runProxy()

	let result = await axios.get(`http://localhost:${proxyPort}/login`)
	dbg('result.data=%s', pretty(result.data, {ocd: true}))

	const action = getFormAction({html: result.data})

	// from local config to keep out of scm
	//
	const {name, password} = config.user

	const _action = isActionRelative ? action : `${delegatedUrl || issuerUrl}${action}`
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
			maxRedirects: 2,
			validateStatus: status => status === 302
		}
	)
	t.is(result.status, 200)
})
