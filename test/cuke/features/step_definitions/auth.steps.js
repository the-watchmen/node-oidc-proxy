import assert from 'assert'
import qs from 'querystring'
import {URL} from 'url'
import jwt from 'jsonwebtoken'
import debug from 'debug'
import {defineSupportCode} from 'cucumber'
import {asTemplate, evalInContext, getUrl, setState} from '@watchmen/test-helpr'
import config from 'config'
import {getFormAction, getCookieAxios} from '../../../shared/test-helper'

const dbg = debug('test:mock:steps')

const port = config.get('listener.port')
const axios = getCookieAxios()

const oauthCfg = config.get('oauth')
const clientCfg = oauthCfg.client

function steps(context) {
  defineSupportCode(function({When}) {
    When(
      'we authenticate with user {string} and password {string} and call {string}',
      async (userString, passwordString, path) => {
        try {
          const user = evalInContext({js: asTemplate(userString), context})
          const password = evalInContext({js: asTemplate(passwordString), context})
          dbg('when-we-authenticate: user=%o, password=%o, path=%o', user, password, path)
          let url = getUrl('/login', {port, context})
          dbg('calling url=%o', url)

          // get login form...
          let result = await axios.get(url)
          const action = getFormAction({html: result.data})
          dbg('login-form-action=%o', action)

          // post login form...
          result = await axios.post(
            `${oauthCfg.issuer.url}${action}`,
            // https://github.com/axios/axios/issues/362#issuecomment-234844677
            qs.stringify({
              login: user, // specific to oidc-provider default login-form...
              password,
              view: 'login'
            }),
            {
              headers: {
                'Content-type': 'application/x-www-form-urlencoded'
              },
              maxRedirects: 2,
              validateStatus: status => status === 302
            }
          )
          const {location} = result.headers
          dbg('login: redirect-location=%o', location)
          // http://localhost:8080/#/authenticated/{token}
          //
          const cb = new URL(location)
          dbg('cb-hash=%o', cb.hash)
          const toks = cb.hash.split('/')
          assert(toks.length === 3, `unexpected toks=${toks}`)
          assert(toks[0] === '#')
          assert(toks[1] === 'authenticated')
          const token = jwt.decode(toks[2])
          dbg('token=%o', token)
          assert(token.sub === user)
          assert(token.iss === oauthCfg.issuer.url)
          assert(token.aud === clientCfg.id)

          url = getUrl('/proxy/widgets', {port, context})
          dbg('calling url=%o', url)

          // get widgets, proxy should append token from session...
          result = await axios.get(url)
          dbg('result.data=%o', result.data)
          setState({response: result})
        } catch (err) {
          dbg('when-we-authenticate: caught error=%o', err)
          setState({response: err.response})
        }
      }
    )
  })
}

export default steps()
