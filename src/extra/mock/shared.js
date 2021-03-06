import _ from 'lodash'
import debug from '@watchmen/debug'

const dbg = debug(__filename)
/*
api/patients?offset={offset}&limit={limit}&sort=[-|+]{sort}
&firstName={firstName}&lastName={lastName}&mrn={mrn}&dob={dob}
*/
export function sharedPre(req) {
	replace(req.query, 'offset', '_start')
	replace(req.query, 'limit', '_limit')
	let {sort} = req.query
	if (sort) {
		if (_.startsWith(sort, '+')) {
			sort = sort.substring(1)
		} else if (_.startsWith(sort, '-')) {
			sort = sort.substring(1)
			req.query._order = 'DESC'
		}

		req.query.sort = sort
		replace(req.query, 'sort', '_sort')
	}

	dbg('shared-pre: query=%o', req.query)
}

// replace({a: 'a'}, 'a', 'b') -> {b: 'a'}
export function replace(o, old, nu) {
	if (o[old]) {
		o[nu] = o[old]
		delete o[old]
	}

	return o
}
