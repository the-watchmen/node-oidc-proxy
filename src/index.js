import crypto from 'crypto'
import assert from 'assert'
import _ from 'lodash'
import bodyParser from 'body-parser'
import cors from 'cors'
import debug from 'debug'
import config from 'config'
import express from 'express'
import session from 'express-session'
import oidcClient from 'openid-client'
import proxy from 'express-http-proxy'

const dbg = debug('lib:oidc-proxy')

const tokenKey = 'session.tokens'
const ctxKey = 'session.ctx'

process.on('unhandledRejection', err => {
  dbg('unhandled-rejection: %o', err)
  process.exit(1)
})

export default async function({sessionStrategy} = {}) {
  dbg('session-strategy=%o', sessionStrategy)
  let store
  if (sessionStrategy) {
    const {getConstructor, options} = sessionStrategy // <-- required format for sessionStrategy
    assert(getConstructor && options, 'getConstructor and options required for sessionStrategy')
    const ctor = getConstructor(session)
    store = new ctor(options)
  } else {
    dbg('WARNING: no sessionStrategy arg provided, defaulting to in-memory...')
    dbg('---> see: https://github.com/expressjs/session#sessionoptions')
  }

  const Issuer = oidcClient.Issuer
  const {oauth: oauthCfg} = config
  const {timeout} = oauthCfg.client
  if (timeout) {
    dbg('timeout=%o', timeout)
    Issuer.defaultHttpOptions = {timeout: parseInt(timeout)}
  }
  dbg('issuer-http-options=%o', Issuer.defaultHttpOptions)
  let client

  async function getClient() {
    if (!client) {
      const issuer = await Issuer.discover(oauthCfg.issuer.url)
      dbg('get-client: issuer properties')
      Reflect.ownKeys(issuer).forEach(key => {
        const val = issuer[key]
        dbg(`${key} = [${val}]`)
      })

      client = new issuer.Client({
        client_id: oauthCfg.client.id,
        client_secret: oauthCfg.client.secret,
        id_token_encrypted_response_alg: oauthCfg.client.idTokenAlgorithm
      })

      client.CLOCK_TOLERANCE = config.oauth.clockTolerance
    }
    return client
  }

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
          dbg('proxy-req-opt-decorator: warning, unable to obtain token from session...')
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

  app.get(
    '/login',
    asyncIt(async (req, res) => {
      const client = await getClient()

      const ctx = {
        state: getRandom(),
        nonce: getRandom()
      }
      _.set(req, ctxKey, ctx)

      const url = client.authorizationUrl({
        ...ctx,
        redirect_uri: oauthCfg.client.redirectUri
      })

      dbg('/login: url=%o', url)
      res.redirect(url)
    })
  )

  app.get(
    '/auth/cb',
    asyncIt(async (req, res) => {
      const client = await getClient()

      const params = client.callbackParams(req)
      const ctx = _.get(req, ctxKey)
      delete req[ctxKey]
      dbg('/auth/cb: params=%o, ctx=%o', params, ctx)
      const tokens = await client.authorizationCallback(oauthCfg.client.redirectUri, params, ctx)
      dbg('/auth/cb: tokens=%o', tokens)
      _.set(req, tokenKey, tokens)
      res.redirect(`${oauthCfg.client.userAgentRedirectUri}/${tokens.id_token}`)
    })
  )

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

  return app
}

export function getRandom() {
  return crypto.randomBytes(16).toString('hex')
}

const asyncIt = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
