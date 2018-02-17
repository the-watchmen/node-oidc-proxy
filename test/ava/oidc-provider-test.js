import qs from 'querystring'
import {URL} from 'url'
import test from 'ava'
import debug from '@watchmen/debug'
import oidcClient from 'openid-client'
import config from 'config'
import {getFormAction, getCookieAxios} from '../shared/test-helper'
import '../shared/mock-oidc-provider'
import {getRandom} from '../../src'

const dbg = debug(__filename)

const axios = getCookieAxios()

const oauthCfg = config.get('oauth')
const clientCfg = oauthCfg.client

test('discover', async t => {
  const Issuer = oidcClient.Issuer

  const issuer = await Issuer.discover(oauthCfg.issuer.url)

  dbg('issuer properties')
  Reflect.ownKeys(issuer).forEach(key => {
    const val = issuer[key]
    dbg(`${key} = [${val}]`)
    val === false || val === undefined || t.truthy(val)
  })

  const client = new issuer.Client({
    client_id: clientCfg.id,
    client_secret: clientCfg.secret,
    id_token_encrypted_response_alg: clientCfg.idTokenAlgorithm
  })

  const ctx = {
    state: getRandom(),
    nonce: getRandom()
  }

  const url = client.authorizationUrl(Object.assign({redirect_uri: clientCfg.redirectUri}, ctx))

  dbg('url=%o', url)

  let result = await axios.get(url)
  const action = getFormAction({html: result.data})
  dbg('action=%o', action)

  result = await axios.post(
    `${oauthCfg.issuer.url}${action}`,
    // https://github.com/axios/axios/issues/362#issuecomment-234844677
    qs.stringify({
      login: 'user-1',
      password: 's3cret',
      view: 'login'
    }),
    {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      },
      maxRedirects: 1,
      validateStatus: status => status === 302
    }
  )
  t.is(result.status, 302)
  const {location} = result.headers
  dbg('cb=%o', location)
  t.truthy(location)
  const cb = new URL(location)
  t.is(`${cb.protocol}//${cb.host}${cb.pathname}`, clientCfg.redirectUri)
  const sp = cb.searchParams
  t.truthy(sp.get('code'))
  t.truthy(sp.get('state'))
  t.truthy(sp.get('session_state'))
  const params = {}
  sp.forEach((val, key) => {
    params[key] = val
  })
  dbg('params=%o', params)
  const tokens = await client.authorizationCallback(clientCfg.redirectUri, params, ctx)
  dbg('tokens=%o', tokens)
})
