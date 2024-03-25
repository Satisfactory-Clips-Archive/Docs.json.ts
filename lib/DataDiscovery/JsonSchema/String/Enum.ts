import {
	SchemaCompilingGenerator,
} from '../../Generator';
import Ajv from 'ajv/dist/2020';

export class Enum extends SchemaCompilingGenerator<
	{type: 'string', enum: [string, ...string[]]},
	unknown,
	unknown
> {
	constructor(ajv: Ajv) {
		super(ajv, {
			type: 'object',
			required: ['type', 'enum'],
			additionalProperties: false,
			properties: {
				type: {type: 'string', const: 'string'},
				enum: {type: 'array', minItems: 1, items: {type: 'string'}},
			},
		});
	}

	generate() {
		return Promise.resolve((raw_data: unknown) => {
			console.log(raw_data);
			throw new Error('bar');
		});
	}
}
