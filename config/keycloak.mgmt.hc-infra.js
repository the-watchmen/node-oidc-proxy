module.exports = {
	oauth: {
		issuer: {
			url: `https://keycloak.mgmt.hci.aetna.com/auth/realms/hc-infra`
		},
		client: {
			id: 'bqNMwYCghaDJk2LyzgVY8ARCg8OGJgZj',
			secret: '6d9dff95-586f-40b6-b3c3-649baf64424b',
			queryHint: {
				// eslint-disable-next-line camelcase
				kc_idp_hint: 'oidc'
			}
		}
	}
}
