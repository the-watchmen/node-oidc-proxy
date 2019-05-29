import debug from '@watchmen/debug'
import {defineSupportCode} from 'cucumber'
import {initState} from '@watchmen/test-helpr'
import config from 'config'
import jsonServer from 'json-server'
import jwt from 'express-jwt'

const dbg = debug(__filename)
dbg('loaded hooks')

const secret = config.get('oauth.client.secret')

function initDb() {
	const app = jsonServer.create()
	app.use((req, res, next) => {
		dbg('headers=%o', req.headers)
		next()
	})
	app.use(jwt({secret, credentialsRequired: true}).unless({method: 'POST'}))
	app.use(jsonServer.defaults())
	const router = jsonServer.router({
		widgets: []
	})
	app.use(router)
	const server = app.listen(config.get('mock.port'), () => {
		dbg('listening at: %o', server.address())
	})
}

defineSupportCode(({BeforeAll, Before}) => {
	// cuke 3 before-all runs before all scenarios for a feature, not before all features
	// https://github.com/cucumber/cucumber-js/issues/918
	BeforeAll(async () => {
		dbg('before-all')
		await require('../../../shared/run-all')
		dbg('started all components...')
	})

	Before(async function() {
		try {
			dbg('before: scenario=%o', this)
			initState()
			initDb()
		} catch (error) {
			dbg('before: caught=%o', error)
			throw error
		}
	})

	// After (each scenario) shutdown test mock...
})
