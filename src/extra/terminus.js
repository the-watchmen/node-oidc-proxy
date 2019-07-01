import http from 'http'
import {createTerminus} from '@godaddy/terminus'
import express from 'express'

export function getTerminus({app, dbg, healthz}) {
	const server = http.createServer(app)

	createTerminus(server, {
		signal: 'SIGINT',
		healthChecks: healthz && {'/healthz': healthz, verbatim: true},
		onSignal: () => {
			dbg('on-signal')
			return Promise.all([
				// cleanup logic here in the form of promises/async functions
			])
		}
	})

	return server
}

export function startTerminus({app, router, port, name, dbg, healthz}) {
	const _app = app || express()
	if (router) {
		app.use('/', router)
	}

	const server = getTerminus({app: _app, dbg, healthz})
	server.listen(port, () => {
		dbg('terminus for app=%o listening on port=%o', name, port)
	})
}
