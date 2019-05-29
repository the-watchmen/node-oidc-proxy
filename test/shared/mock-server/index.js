import path from 'path'
import debug from '@watchmen/debug'
import jsonServer from 'json-server'
import jwt from 'express-jwt'
import {sleep} from '@watchmen/helpr'
import config from 'config'
import _ from 'lodash'
import nocache from 'nocache'
import resources from './resources'

const dbg = debug(__filename)

const secret = _.get(config, 'test.oauth.issuer.signingKey')
const credentialsRequired = _.get(config, 'test.api.credentialsRequired')
const whitelist = _.get(config, 'test.api.whitelist')
if (credentialsRequired) {
	dbg('strictly requiring credentials (except for whitelist=%o)', whitelist)
} else {
	dbg('WARNING: configured without strictly requiring credentials')
}

const _sleep = config.get('test.api.sleep')

export default function() {
	const app = jsonServer.create()

	app.use(jwt({secret, credentialsRequired}).unless({path: whitelist}), (req, res, next) => {
		dbg('jwt-check: req.user=%o', req.user)
		next()
	})

	app.use(jsonServer.defaults())

	const router = jsonServer.router(path.join(__dirname, 'db.json'))
	router.use(nocache())

	router.use((req, res, next) => {
		dbg('get middleware: method=%o, sleep=%o', req.method, _sleep)
		sleep(_sleep)
		if (req.method === 'GET') {
			const index = getIndex(req.url)
			if (index) {
				dbg('get: index=%o', index)
				resources[index].pre(req, res)
			}
		}

		next()
	})

	router.render = function(req, res) {
		let result = res.locals.data
		if (req.method === 'GET') {
			const index = getIndex(req.url)
			if (index) {
				dbg('render: index=%o', index)
				if (index !== 'db') {
					result = resources[index].post(result, req, res)
				}
			}
		}

		res.jsonp(result)
	}

	app.use(router)

	// eslint-disable-next-line no-unused-vars
	app.use((err, req, res, next) => {
		if (err.name === 'UnauthorizedError') {
			dbg('unauthorized-error')
			res.status(401).send({msg: 'token missing or invalid'})
		}
	})

	return app
}

export function getIndex(url) {
	// getIndex('/dogs') -> 'dogs'
	// getIndex('/dogs?food=bacon') -> 'dogs'
	// getIndex('/dogs/:id') -> false
	const toks = url.split('?')[0].split('/')
	const result = toks.length === 2 && !['db', '__rules'].includes(toks[1]) && toks[1]
	dbg('get-index: toks=%o, url=%o, result=%o', toks, url, result)
	return result
}
