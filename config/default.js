// stuff that is null here needs to specified by configuring instance
//
const userAgent = {
	port: null,
	authPath: 'auth/cb',
	logoutPath: 'logout/cb'
}

userAgent.url = null

const client = {
	port: null,
	url: null,
	redirect: {
		path: {
			auth: 'auth/cb',
			logout: 'logout/cb'
		}
	}
}

module.exports = {
	session: {
		secret: 's3cret'
	},
	oauth: {
		issuer: {
			url: null
		},
		client: {
			...client,
			id: null,
			secret: null,
			redirect: {
				...client.redirect,
				auth: `${client.url}/${client.redirect.path.auth}`,
				logout: `${client.url}/${client.redirect.path.logout}`
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
			auth: `${userAgent.url}/${userAgent.authPath}`,
			logout: `${userAgent.url}/${userAgent.logoutPath}`
		}
	},
	api: {
		url: null
	}
}
