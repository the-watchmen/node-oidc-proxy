import Provider from 'oidc-provider'
import debug from 'debug'
import config from 'config'
import jwt from 'jsonwebtoken'
import _ from 'lodash'

const dbg = debug('test:oidc-provider')
const secret = config.get('oauth.client.secret')
const client = {
  client_id: config.get('oauth.client.id'),
  client_secret: secret,
  redirect_uris: [config.get('oauth.client.redirectUri')],
  grant_types: ['authorization_code']
}
const oidc = new Provider(config.get('oauth.issuer.url'), config.get('idp'))
const port = config.get('oauth.issuer.port')

let _app
oidc.initialize({clients: [client]}).then(() => {
  dbg('listening on port=%o', port)
  _app = oidc.app.listen(port)
})

// https://github.com/panva/node-oidc-provider/issues/93#issuecomment-333486517
//
oidc.AccessToken.prototype.getValueAndPayload = async function() {
  dbg('get-value-and-payload: this=%o, issuer=%o', this, oidc.issuer)
  const payload = _.pick(this, this.constructor.IN_PAYLOAD)
  const token = jwt.sign(payload, secret, {
    expiresIn: this.expiration,
    issuer: oidc.issuer
  })

  const [header, _payload, signature] = token.split('.')

  return [
    token,
    {
      header,
      _payload,
      signature
    }
  ]
}

const app = _app
export default app
