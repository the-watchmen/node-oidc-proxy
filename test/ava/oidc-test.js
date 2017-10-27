import test from 'ava'
import debug from 'debug'
import oidcClient from 'openid-client'
// import _ from 'lodash'

const dbg = debug('test:oidc')

test('discover', async t => {
  const Issuer = oidcClient.Issuer

  const issuer = await Issuer.discover(
    'https://auth.lab.ds.aetna.com/auth/realms/realm-1/.well-known/openid-configuration'
  )

  dbg('issuer properties')
  Reflect.ownKeys(issuer).forEach(key => {
    const val = issuer[key]
    dbg(`${key} = [${val}]`)
    val === false || val === undefined || t.truthy(val)
  })
  //---
  const client = new issuer.Client({
    client_id: 'client-2',
    client_secret: '62597053-51ae-49e2-85b8-75ddf0961042'
  })
  t.truthy(client)
  //---
  const url = client.authorizationUrl({
    redirect_uri: 'https://localhost:8080/callback',
    scope: 'openid email'
  })
  dbg('url=%s', url)
})
