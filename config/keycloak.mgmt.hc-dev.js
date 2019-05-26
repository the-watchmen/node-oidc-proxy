module.exports = {
	oauth: {
		issuer: {
			url: `https://keycloak.mgmt.hci.aetna.com/auth/realms/hc-dev`
		},
		client: {
			id: 'bqNMwYCghaDJk2LyzgVY8ARCg8OGJgZj',
			secret: '806c8719-82ec-41b9-b6eb-9cfebb68cb79',
			queryHint: {
				// eslint-disable-next-line camelcase
				kc_idp_hint: 'oidc'
			}
		}
	},
	api: {
		url: 'https://api.dev.hci.aetna.com'
		// url: 'http://localhost:3001'
	}
}
