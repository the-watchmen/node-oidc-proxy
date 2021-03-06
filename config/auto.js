import dflt from './default'

// ports:
// user-agent: 3000
// client(proxy): 3001
// idp: 3002
// api: 3003
//
const userAgent = {
	port: 3000,
	proxyPath: 'oidc'
}

userAgent.url = `http://localhost:${userAgent.port}`

const client = {
	port: 3001,
	redirect: {},
	proxyPath: 'api'
}

client.url = `http://localhost:${client.port}`

const oauth = {
	issuer: {
		port: 3002
	}
}

const api = {
	port: 3003
}

api.url = `http://localhost:${api.port}`

module.exports = {
	oauth: {
		issuer: {
			...oauth.issuer,
			url: `http://localhost:${oauth.issuer.port}`
		},
		client: {
			...client,
			id: 'client-1',
			secret: 's3cret',
			redirect: {
				...client.redirect,
				auth: `${client.url}/${dflt.oauth.client.redirect.path.auth}`,
				logout: `${client.url}/${dflt.oauth.client.redirect.path.logout}`
			},
			timeout: 3000,
			responseType: 'code',
			scope: 'openid email profile'
		}
	},
	api,
	userAgent: {
		...dflt.userAgent,
		...userAgent,
		redirect: {
			auth: `${userAgent.url}/${dflt.userAgent.authPath}`,
			logout: `${userAgent.url}/${dflt.userAgent.logoutPath}`
		}
	},
	// stuff only used for testing...
	//
	test: {
		oauth: {
			issuer: {
				isActionRelative: true,
				usernameField: 'login',
				passwordField: 'password',
				config: {
					features: {
						introspection: {enabled: true},
						sessionManagement: {enabled: true}
					}
				},
				user: {
					name: 'user-1',
					password: 's3cret'
				},
				signingKey: 's3cret'
			}
		},
		api: {
			...api,
			sleep: 1000,
			credentialsRequired: true,
			whitelist: ['/']
		}
	}
}
