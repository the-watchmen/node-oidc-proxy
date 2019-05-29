import config from 'config'
import oidcClient, {custom, generators} from 'openid-client'
import debug from '@watchmen/debug'

/* eslint-disable camelcase */

const dbg = debug(__filename)

const responseType = config.get('oauth.client.responseType')
const isAuthGrant = responseType === 'code'
const timeout = config.get('oauth.client.timeout')
const clockTolerance = config.get('oauth.clockTolerance')
const authRedirect = config.get('oauth.client.redirect.auth')
const logoutRedirect = config.get('oauth.client.redirect.logout')
const scope = config.get('oauth.client.scope')
const {queryHint} = config.oauth.client

export function getIssuer() {
	dbg('get-issuer')
	const {Issuer} = oidcClient
	return Issuer.discover(config.get('oauth.issuer.url'))
}

export async function getClient({issuer} = {}) {
	dbg('get-client')
	const _issuer = issuer || (await getIssuer())

	const client = new _issuer.Client({
		client_id: config.get('oauth.client.id'),
		client_secret: config.get('oauth.client.secret'),
		response_types: [responseType]
		// id_token_encrypted_response_alg: config.oauth.client.idTokenAlgorithm
	})

	if (timeout) {
		dbg('timeout=%o', timeout)
		client[custom.http_options] = options => {
			options.timeout = parseInt(timeout)
			return options
		}
	}

	if (clockTolerance) {
		client[custom.clock_tolerance] = parseInt(clockTolerance)
	}

	return client
}

export function getContext() {
	return {
		state: generators.state(),
		nonce: generators.nonce(),
		code_verifier: isAuthGrant && generators.codeVerifier()
	}
}

export async function getAuthUrl({client, context} = {}) {
	const _client = client || (await getClient())
	return _client.authorizationUrl({
		redirect_uri: authRedirect,
		scope,
		state: context.state,
		nonce: context.nonce,
		...(isAuthGrant && {
			code_challenge: generators.codeChallenge(context.code_verifier),
			code_challenge_method: 'S256'
		}),
		...queryHint
	})
}

export async function getLogoutUrl({client, context, hint} = {}) {
	const _client = client || (await getClient())
	return _client.endSessionUrl({
		id_token_hint: hint,
		post_logout_redirect_uri: logoutRedirect,
		state: context.state
	})
}
