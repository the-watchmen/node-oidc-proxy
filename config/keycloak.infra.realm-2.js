module.exports = {
	oauth: {
		issuer: {
			url: `https://keycloak.infra.hci.aetna.com/auth/realms/realm-2`,
			usernameField: 'username',
			isActionRelative: false
		},
		client: {
			id: 'client-2',
			secret: '05a7674f-c227-430f-b5f6-521df00244d0',
			queryHint: {
				// eslint-disable-next-line camelcase
				kc_idp_hint: 'oidc'
			}
		}
	}
}
