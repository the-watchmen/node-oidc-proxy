import assert from 'assert'
import debug from '@watchmen/debug'
import htmlParser from 'htmlparser2'
import axios from 'axios'
import axiosCookieJarSupport from '@3846masa/axios-cookiejar-support'
import tough from 'tough-cookie'

const dbg = debug(__filename)

export function getFormAction({html}) {
	let action
	const parser = new htmlParser.Parser(
		{
			onopentag(name, attributes) {
				// dbg('on-open-tag: name=%o, attribs=%o', name, attribs)
				if (name === 'form') {
					dbg('on-open-tag: name=%o, attribs=%o', name, attributes)
					action = attributes.action
				}
			}
		},
		{decodeEntities: true}
	)
	parser.write(html)
	assert(action, `unable to find action in html=${html}`)
	return action
}

export function getCookieAxios() {
	const cookieJar = new tough.CookieJar()
	// axios.defaults.jar = cookieJar
	// axios.defaults.withCredentials = true
	const _axios = axios.create({
		withCredentials: true,
		jar: cookieJar
	})
	axiosCookieJarSupport(_axios)
	return _axios
}
