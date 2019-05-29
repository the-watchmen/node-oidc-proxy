import faker from 'faker'
import _ from 'lodash'
import RandExp from 'randexp'
import {standard} from '@watchmen/json-server-helpr'
import resource from './resource'

const {pre} = standard

const ssnRe = new RandExp(/\d{3}-\d{2}-\d{4}/)
const phoneRe = new RandExp(/\d{3}-\d{3}-\d{4}/)
const zipRe = new RandExp(/\d{5}/)

export default Object.assign({}, resource, {
	fake: index => {
		const firstName = faker.name.firstName()
		const lastName = faker.name.lastName()
		return {
			id: index,
			firstName,
			lastName,
			fullName: `${lastName}, ${firstName}`,
			dateOfBirth: faker.date.past(),
			gender: _.sample(['M', 'F']),
			ssn: ssnRe.gen(),
			phone: phoneRe.gen(),
			street: faker.address.streetAddress(),
			city: faker.address.city(),
			state: faker.address.stateAbbr(),
			zip: zipRe.gen()
		}
	},

	pre
})
