import fs from 'fs'
import debug from 'debug'
import _ from 'lodash'
import resources from './resources'

const dbg = debug('app:mock:generate')
const db = 'mock-server/db.json'

dbg('generating mock data file=%o', db)

const data = _.mapValues(resources, val => {
  return val.generate()
})

fs.writeFileSync(db, JSON.stringify(data, null, 2), 'utf-8')
