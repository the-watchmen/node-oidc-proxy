import debug from '@watchmen/debug'
import config from 'config'
import getCore from '../../src'
import getTerminusServer from '../../src/get-terminus-server'

const dbg = debug(__filename)

const port = config.get('listener.port')

export default async function() {
	const app = await getCore()
	dbg('obtained reference to proxy')

	const server = getTerminusServer({app, dbg})

	server.listen(port, () => {
		dbg('proxy listening on port=%o', port)
	})
	return app
}
