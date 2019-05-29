import debug from '@watchmen/debug'
import {webHelpr} from '@watchmen/web-helpr'
import config from 'config'
import express from 'express'
import _ from 'lodash'

const dbg = debug(__filename)

const decorator = _.get(config, 'api.responseDecorator')

export default function() {
	// set up local listener to eventually receive callback
	//
	const app = express()

	app.get('/', (req, res) => {
		webHelpr.dbgReq({dbg, req})
		res.send(decorator)
	})

	app.get(`/${config.get('userAgent.path.auth')}`, (req, res) => {
		webHelpr.dbgReq({dbg, req})
		res.send({msg: 'session initiated', data: req.query, ...decorator})
	})

	app.get(`/${config.get('userAgent.path.logout')}`, (req, res) => {
		webHelpr.dbgReq({dbg, req})
		res.send({msg: 'session terminated', ...decorator})
	})

	return app
}
