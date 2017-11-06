import debug from 'debug'
import jsonServer from 'json-server'
import jwt from 'express-jwt'
import {sleep} from '@watchmen/helpr'
import config from 'config'
import resources from './resources'

const dbg = debug('test:mock')

// think: const app = express()
const app = jsonServer.create()
// this secret needs to correspond to that of oidc provider,
// in case of keycloak see realm-settings-> keys -> rsa -> public-key
// and use formatPublicKey from 'web-helpr' package...
//
const secret = config.get('oauth.client.secret')
app.use(jwt({secret, credentialsRequired: false}).unless({path: ['/']}))
app.use((req, res, next) => {
  dbg('jwt-check: req.user=%o', req.user)
  next()
})
app.use(jsonServer.defaults())
const router = jsonServer.router(config.get('mock.db'))

const _sleep = config.mock.sleep

app.use((req, res, next) => {
  dbg('get middleware: method=%o, sleep=%o', req.method, _sleep)
  sleep(_sleep)
  if (req.method == 'GET') {
    const index = getIndex(req.url)
    if (index) {
      dbg('get: index=%o', index)
      resources[index].pre(req, res)
    }
  }
  next()
})

app.use(
  jsonServer.rewriter({
    '/api/': '/'
  })
)

app.use(router)

router.render = function(req, res) {
  let result = res.locals.data
  if (req.method == 'GET') {
    const index = getIndex(req.url)
    if (index) {
      dbg('render: index=%o', index)
      if (index != 'db') {
        result = resources[index].post(result, req, res)
      }
    }
  }
  res.jsonp(result)
}

const server = app.listen(config.mock.port, () => {
  dbg('listening at: %o', server.address())
})

export function getIndex(url) {
  // getIndex('/dogs') -> 'dogs'
  // getIndex('/dogs?food=bacon') -> 'dogs'
  // getIndex('/dogs/:id') -> false
  const toks = url.split('?')[0].split('/')
  const result = toks.length == 2 && !['db', '__rules'].includes(toks[1]) && toks[1]
  dbg('get-index: toks=%o, url=%o, result=%o', toks, url, result)
  return result
}
