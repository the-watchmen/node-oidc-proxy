import http from 'http'
import {createTerminus} from '@godaddy/terminus'

export default ({app, dbg}) => {
	const server = http.createServer(app)

	createTerminus(server, {
		signal: 'SIGINT',
		onSignal: () => {
			dbg('on-signal')
			return Promise.all([
				// cleanup logic here in the form of promises/async functions
			])
		}
	})

	return server
}
