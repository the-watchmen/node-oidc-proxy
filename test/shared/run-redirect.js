import debug from '@watchmen/debug'
import {webHelpr} from '@watchmen/web-helpr'
import config from 'config'
import express from 'express'
import getTerminusServer from '../../src/get-terminus-server'

const {userAgent} = config
const dbg = debug(__filename)

export default function() {
	// set up local listener to eventually receive callback
	//
	const app = express()

	app.get(`/${userAgent.path.auth}`, (req, res) => {
		webHelpr.dbgReq({dbg, req})
		res.send({msg: 'session initiated', data: req.query, status: 200})
	})

	app.get(`/${userAgent.path.logout}`, (req, res) => {
		webHelpr.dbgReq({dbg, req})
		res.send({msg: 'session terminated', status: 200})
	})

	const server = getTerminusServer({app, dbg})

	server.listen(userAgent.port, () => {
		dbg('user-agent listening on port=%o', userAgent.port)
	})

	return app
}
