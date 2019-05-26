module.exports = {
	oauth: {
		issuer: {
			url: `https://keycloak.infra.hci.aetna.com/auth/realms/hc-infra`
		},
		client: {
			id: 'client-1',
			secret: 'ca8c0785-892c-46a7-9a18-3edeab75c5c8',
			queryHint: {
				// eslint-disable-next-line camelcase
				kc_idp_hint: 'oidc'
			}
		}
	}
}
