import debug from '@watchmen/debug'
import {defineSupportCode} from 'cucumber'
import {asTemplate, evalInContext} from '@watchmen/test-helpr'
import config from 'config'
import axios from 'axios'

const dbg = debug(__filename)

const url = config.get('mock.url')

export default function(context) {
  defineSupportCode(function({Given}) {
    Given(
      'the following records exist for resource {string}:',
      async (resourceString, recsString) => {
        try {
          const resource = evalInContext({js: asTemplate(resourceString), context})
          const recs = evalInContext({js: recsString, context})
          dbg('given-records-exist: resource=%o, recs=%o', resource, recs)
          const _url = `${url}/${resource}`
          for (const rec of recs) {
            dbg('attempting post: url=%o, rec=%o', _url, rec)
            await axios.post(_url, rec)
            // dbg('result=%o', result)
          }
        } catch (err) {
          dbg('given-records-exist: caught error=%o', err)
          throw err
        }
      }
    )
  })
}
