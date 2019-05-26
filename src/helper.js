import config from 'config'
import oidcClient, {custom, generators} from 'openid-client'
import debug from '@watchmen/debug'

/* eslint-disable camelcase */

const dbg = debug(__filename)
const {oauth: oauthCfg} = config
dbg('cfg=%O', oauthCfg)

const {
	redirect,
	scope,
	id,
	secret,
	responseType,
	idTokenAlgorithm,
	timeout,
	queryHint
} = oauthCfg.client

const isAuthGrant = responseType === 'code'

export function getIssuer() {
	const {Issuer} = oidcClient
	return Issuer.discover(oauthCfg.issuer.url)
}

export async function getClient({issuer} = {}) {
	const _issuer = issuer || (await getIssuer())

	const client = new _issuer.Client({
		client_id: id,
		client_secret: secret,
		response_types: [responseType],
		id_token_encrypted_response_alg: idTokenAlgorithm
	})

	if (timeout) {
		dbg('timeout=%o', timeout)
		client[custom.http_options] = options => {
			options.timeout = parseInt(timeout)
			return options
		}
	}

	const {clockTolerance} = oauthCfg
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
		redirect_uri: redirect.auth,
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
		post_logout_redirect_uri: redirect.logout,
		state: context.state
	})
}
