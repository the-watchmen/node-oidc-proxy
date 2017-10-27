// eslint-disable-next-line import/no-unassigned-import
// import 'babel-polyfill'
// import assert from 'assert'
import _ from 'lodash'
import bodyParser from 'body-parser'
import cors from 'cors'
import debug from 'debug'
import config from 'config'
// import jwt from 'express-jwt'
// import {formatPublicKey} from 'web-helpr'
import express from 'express'
import session from 'express-session'
// import connectEnsureLogin from 'connect-ensure-login'
import passport from 'passport'
import oidcClient from 'openid-client'
import proxy from 'express-http-proxy'

const dbg = debug('app:index')

// eslint-disable-next-line no-undef
process.on('unhandledRejection', err => {
  dbg('unhandled-rejection: %o', err)
  // eslint-disable-next-line no-undef
  process.exit(1)
})

const STRATEGY = 'oidc'

export default (async function() {
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
    client_secret: oauth.client.secret,
    redirect_uris: [oauth.client.redirectUri]
  })

  // const params = {
  //   // ... any authorization request parameters go here
  //   // client_id defaults to client.client_id
  //   // redirect_uri defaults to client.redirect_uris[0]
  //   // response type defaults to client.response_types[0], then 'code'
  //   // scope defaults to 'openid'
  //   redirect_uri:
  // }

  passport.use(
    STRATEGY,
    new oidcClient.Strategy(
      {client, params: {client_id: oauth.client.id}, passReqToCallback: true},
      (tokenset, userinfo, done) => {
        dbg('tokenset', tokenset)
        dbg('access_token', tokenset.access_token)
        dbg('id_token', tokenset.id_token)
        dbg('claims', tokenset.claims)
        dbg('userinfo', userinfo)
        // do i need to call passport's done() here?
        // drop tokens in session here?
        return done(null, {})
      }
    )
  )

  const app = express()
  app.use(session({secret: 's3cret', resave: false, saveUninitialized: false}))

  // calls to /proxy/... will pass thru after appending token obtained from session
  app.use(
    '/proxy',
    proxy(config.api.url, {
      preserveReqSession: true,
      proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
        // dbg('prod: headers=%o', srcReq.headers)
        // dbg('prod: pro=%o, session=%o', proxyReqOpts, srcReq.session)
        // const {grant} = srcReq.session
        const token = _.get(srcReq, 'session.grant.response.access_token')
        if (token) {
          // const {access_token} = grant.response
          proxyReqOpts.headers['Authorization'] = `Bearer ${token}`
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
    res.setHeader('Content-Security-Policy', 'default-src "none"; connect-src "self" https:;')
    next()
  })

  app.get('/', function(req, res) {
    res.send(`proxy: session active=${req.session.grant !== undefined}`)
  })

  app.get('/auth', passport.authenticate(STRATEGY))

  app.get('/auth/cb', function(req) {
    dbg('/auth/cb: session=%o', req.session)
    // const {raw} = req.query
    //const {grant} = req.session
    // dbg('callback: req.query.raw=%o', raw)
    //dbg('callback: req.session.grant=%o', grant)
    // res.send(JSON.stringify(grant, null, 2))
    //const idToken = _.get(grant, 'response.raw.id_token')
    //assert(idToken, 'id_token required')
    // res.redirect(`http://localhost:8080/#/authenticated/${idToken}`)
    // res.redirect(`http://localhost:8080/#/authenticated/${1}`)
    passport.authenticate(STRATEGY, {successRedirect: '/', failureRedirect: '/login'})
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
