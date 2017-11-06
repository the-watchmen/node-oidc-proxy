import debug from 'debug'
import config from 'config'
// eslint-disable-next-line
import getCore from './core'
import connectRedis from 'connect-redis'

const dbg = debug('app:oidc-redis-proxy')

const port = config.get('listener.port')

export default (async function() {
  const app = await getCore({
    sessionStrategy: {getConstructor: connectRedis, options: {url: config.get('session.url')}}
  })
  app.listen(port, () => {
    dbg('listening on port=%o', port)
  })
})()
