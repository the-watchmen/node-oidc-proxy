import test from 'ava'
import debug from '@watchmen/debug'
import {getIssuer, getClient, getAuthUrl, getContext} from '../../src/helper'

const dbg = debug(__filename)

test('issuer', async t => {
	const issuer = await getIssuer()
	t.truthy(issuer)
})

test('metadata', async t => {
	const issuer = await getIssuer()
	dbg('metadata=%O', issuer.metadata)
	t.truthy(issuer.metadata)
})

test('client', async t => {
	const client = await getClient()
	t.truthy(client)
})

test('url', async t => {
	const url = await getAuthUrl({context: getContext()})
	dbg('auth-url=%o', url)
	t.truthy(url)
})
