export default {
	fake: () => {
		throw new Error('fake required')
	},

	count: 23,

	pre: (/* req, res */) => {
		// no-op
	},

	post: data => {
		return data
	},

	generate() {
		const data = []
		for (let i = 0; i < this.count; i++) {
			data.push(this.fake(i))
		}

		return data
	}
}
