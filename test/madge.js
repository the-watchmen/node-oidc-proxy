import madge from 'madge'
import debug from '@watchmen/debug'
import _ from 'lodash'

const dbg = debug(__filename)

export default (async function() {
	const deps = await npmDeps(['src/helper.js', 'src/index.js'])
	const extraDeps = await npmDeps('src/extra')
	dbg('main=%O', deps)
	dbg('extra=%O', extraDeps)
	const missing = _.transform(extraDeps, (result, elt) => {
		!deps.includes(elt) && result.push(elt)
	})
	dbg('unique-extra=%O', missing)
})()

const npm = 'node_modules'
const sep = '/'
async function npmDeps(target) {
	const res = await madge(target, {includeNpm: true})
	const set = _.transform(
		await res.obj(),
		(result, val) => {
			_.each(val, elt => {
				const idx = elt.indexOf(npm)
				if (idx > -1) {
					const file = elt.substring(idx + npm.length + 1)
					const toks = file.split(sep)
					const pkg = toks[0].startsWith('@') ? toks.slice(0, 2).join(sep) : toks[0]
					result.add(pkg)
				}
			})
		},
		new Set()
	)
	return [...set].sort()
}
