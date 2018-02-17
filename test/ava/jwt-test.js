import test from 'ava'
import debug from '@watchmen/debug'
import jwt from 'jsonwebtoken'
// import _ from 'lodash'

const dbg = debug(__filename)

test('basic', t => {
  const secret = 's3cret'
  const token = jwt.sign({foo: 'bar'}, secret)
  dbg('token=%o', token)
  t.truthy(token)

  const decoded = jwt.verify(token, secret)
  dbg('decoded=%o', decoded)
  t.is(decoded.foo, 'bar')
  t.throws(() => {
    jwt.verify(token, 'fail')
  })
})
