import http from 'http'
import {createTerminus} from '@godaddy/terminus'

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

export function startTerminus({app, port, name, dbg}) {
	// dbg('starting terminus-server with app=%o on port=%o', name, port)
	const server = getTerminus({app, dbg})
	server.listen(port, () => {
		dbg('terminus for app=%o listening on port=%o', name, port)
	})
}
