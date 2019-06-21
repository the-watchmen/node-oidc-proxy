import Provider from 'oidc-provider'
import debug from '@watchmen/debug'
import config from 'config'
import jwt from 'jsonwebtoken'
import _ from 'lodash'

/* eslint-disable camelcase */

const dbg = debug(__filename)

const _client = {
	client_id: config.get('oauth.client.id'),
	client_secret: config.get('oauth.client.secret'),
	redirect_uris: [config.get('oauth.client.redirect.auth')],
	post_logout_redirect_uris: [config.get('oauth.client.redirect.logout')],
	grant_types: ['authorization_code']
}

dbg('_client=%o', _client)

async function get() {
	const provider = new Provider(config.get('oauth.issuer.url'), {
		...config.get('test.oauth.issuer.config')
		// clients: [_client]
	})

	// https://github.com/panva/node-oidc-provider/issues/93#issuecomment-333486517
	//
	provider.AccessToken.prototype.getValueAndPayload = async function() {
		dbg('get-value-and-payload: this=%o, issuer=%o', this, provider.issuer)
		const payload = _.pick(this, this.constructor.IN_PAYLOAD)
		const token = jwt.sign(payload, config.get('test.oauth.issuer.signingKey'), {
			expiresIn: this.expiration,
			issuer: provider.issuer
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

	const clients = [_client]
	await provider.initialize({clients})
	return provider
}

export default async function() {
	const provider = await get()
	return provider.callback
}
