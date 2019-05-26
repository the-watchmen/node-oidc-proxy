const oauth = {
	issuer: {
		port: 3002
	}
}

const client = {
	redirect: {
		base: 'http://localhost:3000'
	}
}

const userAgent = {
	base: 'http://localhost',
	port: 8080,
	path: {
		auth: 'auth/cb',
		logout: 'logout/cb'
	}
}

module.exports = {
	listener: {
		port: 3000
	},
	session: {
		secret: 's3cret'
	},
	oauth: {
		issuer: {
			...oauth.issuer,
			url: `http://localhost:${oauth.issuer.port}`,
			// following settings for https://github.com/panva/node-oidc-provider
			// override in issuer specific configs (e.g. keycloak, etc)
			//
			isActionRelative: true,
			usernameField: 'login',
			passwordField: 'password'
		},
		client: {
			id: 'client-2',
			secret: 's3cret',
			redirect: {
				auth: `${client.redirect.base}/auth/cb`,
				logout: `${client.redirect.base}/logout/cb`
			},
			timeout: 3000,
			// responseType: 'id_token token',
			responseType: 'code',
			scope: 'openid email profile'
		},
		clockTolerance: 5
	},
	userAgent: {
		...userAgent,
		includeAccessToken: true,
		includeRefreshToken: true,
		redirect: {
			auth: `${userAgent.base}:${userAgent.port}/${userAgent.path.auth}`,
			logout: `${userAgent.base}:${userAgent.port}/${userAgent.path.logout}`
		}
	},
	idp: {features: {sessionManagement: true}},
	api: {
		// assumes all api's at single location,
		// would need to be revisited if this wasn't the case...
		url: 'http://localhost:3001'
	},
	mock: {
		sleep: 1000,
		port: 3001,
		url: 'http://localhost:3001',
		db: 'mock-server/db.json'
	}
}
