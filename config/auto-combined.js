import dflt from './default'

// ports:
// user-agent: 3000
// client(proxy): 3000
// idp: 3001
// api: 3000
//
const userAgent = {
	port: 3000,
	proxyPath: 'proxy-oidc',
	path: 'user-agent'
}

userAgent.url = `http://localhost:${userAgent.port}/${userAgent.path}`

const client = {
	port: 3000,
	redirect: {},
	proxyPath: 'proxy-api',
	path: 'oidc'
}

client.url = `http://localhost:${client.port}/${client.path}`

const oauth = {
	issuer: {
		port: 3001
	}
}

const api = {
	port: 3000,
	path: 'api'
}

api.url = `http://localhost:${api.port}/${api.path}`

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
		},
		proxies: {
			'proxy-api': `${userAgent.url}/${api.path}`
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
