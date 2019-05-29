import qs from 'querystring'
import {URL} from 'url'
import test from 'ava'
import debug from '@watchmen/debug'
import config from 'config'
import {getFormAction, getCookieAxios} from '../shared/test-helper'
import all from '../shared/run-all'
import {getClient, getAuthUrl, getContext} from '../../src/helper'

const dbg = debug(__filename)

const axios = getCookieAxios()

test('tokens', async t => {
	await all

	const client = await getClient()
	const context = getContext()
	const url = await getAuthUrl({client, context})
	dbg('url=%o', url)

	let result = await axios.get(url)
	const action = getFormAction({html: result.data})
	dbg('action=%o', action)

	// from local config to keep out of scm
	//
	const {name, password} = config.get('test.oauth.issuer.user')
	result = await axios.post(
		`${config.get('oauth.issuer.url')}${action}`,
		// https://github.com/axios/axios/issues/362#issuecomment-234844677
		//
		qs.stringify({
			login: name,
			password,
			view: 'login'
		}),
		{
			headers: {
				'Content-type': 'application/x-www-form-urlencoded'
			},
			// maxRedirects: 1,
			validateStatus: status => status === 302
		}
	)
	t.is(result.status, 302)
	const {location} = result.headers
	dbg('cb=%o', location)
	t.truthy(location)
	const cb = new URL(location)
	const redirect = config.get('oauth.client.redirect.auth')

	t.is(`${cb.protocol}//${cb.host}${cb.pathname}`, redirect)
	const sp = cb.searchParams
	t.truthy(sp.get('code'))
	t.truthy(sp.get('state'))
	t.truthy(sp.get('session_state'))
	const params = {}
	sp.forEach((val, key) => {
		params[key] = val
	})
	dbg('params=%o', params)
	const tokens = await client.authorizationCallback(redirect, params, context)
	dbg('tokens=%o', tokens)
})
