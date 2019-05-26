module.exports = {
	oauth: {
		issuer: {
			url: `https://keycloak.lab.hci.aetna.com/auth/realms/master`
		},
		client: {
			// id: 'pineapple-client',
			// secret: 'f78a16ae-c5ba-4f5c-ac13-524c0301e7a5',
			id: 'bqNMwYCghaDJk2LyzgVY8ARCg8OGJgZj',
			secret: 'd74e30a5-8422-46e2-b5f9-1126062e950c',
			queryHint: {
				// eslint-disable-next-line camelcase
				kc_idp_hint: 'oidc'
			}
		}
	},
	api: {
		url: 'https://api.lab.hci.aetna.com'
	}
}
