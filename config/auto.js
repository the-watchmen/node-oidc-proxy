module.exports = {
	oauth: {
		// issuer: {
		// 	url:
		// 		'https://keycloak.infra.hci.aetna.com/auth/realms/hc-infra/.well-known/openid-configuration'
		// },
		client: {
			id: 'client-1',
			secret: 's3cret',
			redirect: 'https://localhost:8080/callback',
			scope: 'openid email'
		}
	}
}
