import debug from 'debug'
import config from 'config'
import getCore from '../../src'

const dbg = debug('test:oidc-proxy')

const port = config.get('listener.port')

export default (async function() {
  const app = await getCore()
  app.listen(port, () => {
    dbg('listening on port=%o', port)
  })
})()
