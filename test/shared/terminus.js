import http from 'http'
import {createTerminus} from '@godaddy/terminus'
import express from 'express'

export function getTerminus({app, dbg}) {
	const server = http.createServer(app)

	createTerminus(server, {
		signal: 'SIGINT',
		healthChecks: {
			'/healthz': () => {
				dbg('healthz')
			}
		},
		onSignal: () => {
			dbg('on-signal')
			return Promise.all([
				// cleanup logic here in the form of promises/async functions
			])
		}
	})

	return server
}

export function startTerminus({app, router, port, name, dbg}) {
	const _app = app || express()
	if (router) {
		app.use('/', router)
	}

	const server = getTerminus({app: _app, dbg})
	server.listen(port, () => {
		dbg('terminus for app=%o listening on port=%o', name, port)
	})
}
