import runProxy from './run-proxy'
import runRedirect from './run-redirect'

export default (async function() {
	await runRedirect()
	await runProxy()
})()
