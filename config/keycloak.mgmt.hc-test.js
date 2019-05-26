module.exports = {
	oauth: {
		issuer: {
			url: `https://keycloak.mgmt.hci.aetna.com/auth/realms/hc-test`
		},
		client: {
			id: 'bqNMwYCghaDJk2LyzgVY8ARCg8OGJgZj',
			secret: '8603340d-fc9c-4667-a9c9-68e674c7dc53',
			queryHint: {
				// eslint-disable-next-line camelcase
				kc_idp_hint: 'oidc'
			}
		}
	},
	api: {
		url: 'https://api.test.hci.aetna.com'
	}
}
