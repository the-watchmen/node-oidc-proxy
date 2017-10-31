import crypto from 'crypto'
import _ from 'lodash'
import bodyParser from 'body-parser'
import cors from 'cors'
import debug from 'debug'
import config from 'config'
import express from 'express'
import session from 'express-session'
import oidcClient from 'openid-client'
import proxy from 'express-http-proxy'

const dbg = debug('app:index')

const tokenKey = 'session.tokens'
const ctxKey = 'session.ctx'

process.on('unhandledRejection', err => {
  dbg('unhandled-rejection: %o', err)
  process.exit(1)
})

export default (async function({store} = {}) {
  const Issuer = oidcClient.Issuer
  const {oauth} = config

  const issuer = await Issuer.discover(oauth.issuer.url)

  // dbg('issuer properties')
  // Reflect.ownKeys(issuer).forEach(key => {
  //   const val = issuer[key]
  //   dbg(`${key} = [${val}]`)
  // })

  const client = new issuer.Client({
    client_id: oauth.client.id,
    client_secret: oauth.client.secret
  })

  client.CLOCK_TOLERANCE = config.oauth.clockTolerance

  const app = express()

  app.use(
    session({store, secret: config.get('session.secret'), resave: false, saveUninitialized: false})
  )

  // calls to /proxy/... will pass thru after appending token obtained from session
  app.use(
    '/proxy',
    proxy(config.api.url, {
      preserveReqSession: true,
      proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
        // dbg('proxy: headers=%o', srcReq.headers)
        const tokens = _.get(srcReq, tokenKey)
        if (tokens) {
          proxyReqOpts.headers['Authorization'] = `Bearer ${tokens.access_token}`
        } else {
          dbg('proxy-req-opt-decorator: warning, unable to obtain token from session, YMMV...')
        }
        return proxyReqOpts
      }
    })
  )

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(cors())
  app.use((req, res, next) => {
    // checkmarx complaint?
    res.setHeader('Content-Security-Policy', 'default-src "none"; connect-src "self" https:;')
    next()
  })

  app.get('/', function(req, res) {
    res.send(`proxy: session active=${_.get(req, tokenKey) !== undefined}`)
  })

  app.get('/login', (req, res) => {
    const ctx = {
      state: getRandom(),
      nonce: getRandom()
    }
    _.set(req, ctxKey, ctx)

    const url = client.authorizationUrl({
      ...ctx,
      redirect_uri: oauth.client.redirectUri
    })

    dbg('/login: url=%o', url)
    res.redirect(url)
  })

  app.get('/auth/cb', async (req, res) => {
    const params = client.callbackParams(req)
    const ctx = _.get(req, ctxKey)
    delete req[ctxKey]
    dbg('/auth/cb: params=%o, ctx=%o', params, ctx)
    const tokens = await client.authorizationCallback(oauth.client.redirectUri, params, ctx)
    dbg('/auth/cb: tokens=%o', tokens)
    _.set(req, tokenKey, tokens)
    res.redirect(`http://localhost:8080/#/authenticated/${tokens.id_token}`)
  })

  // eslint-disable-next-line no-unused-vars
  app.get('/logout', function(req, res) {
    // http://auth-server/auth/realms/{realm-name}/protocol/openid-connect/logout?redirect_uri=encodedRedirectUri
    throw new Error('logout not implemented')
    // res.redirect('/')
  })

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    dbg('default error handler: err:\n%j', err)
    dbg('default error handler: stack:\n%j', err.stack)

    res.send({
      name: err.name,
      message: err.message
    })
  })

  const port = config.get('listener.port')
  app.listen(port, () => {
    dbg('listening on port=%o', port)
  })
})()

function getRandom() {
  return crypto.randomBytes(16).toString('hex')
}
