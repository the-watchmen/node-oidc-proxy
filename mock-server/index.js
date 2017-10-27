import debug from 'debug'
import jsonServer from 'json-server'
import jwt from 'express-jwt'
import {sleep} from '@watchmen/helpr'
import {webHelpr} from '@watchmen/web-helpr'
import config from 'config'
import resources from './resources'

const dbg = debug('app:srv')

// think: const app = express()
const app = jsonServer.create()
// this secret needs to correspond to that of oidc provider,
// in case of keycloak see realm-settings-> keys -> rsa -> public-key
// and use formatPublicKey from 'web-helpr' package...
//
const secret = webHelpr.formatPublicKey({
  key: config.get('listener.secret')
})
app.use(jwt({secret, credentialsRequired: false}).unless({path: ['/']}))
app.use((req, res, next) => {
  dbg('jwt-check: req.user=%o', req.user)
  next()
})
app.use(jsonServer.defaults())
const router = jsonServer.router('mock-server/db.json')

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
  const result = toks.length == 2 && toks[1] != 'db' && toks[1]
  dbg('get-index: url=%o, result=%o', url, result)
  return result
}
