import 'jasmine';

import {
	ajv_is_configured,
	configure_ajv,
	default_config,
	string_to_array,
	string_to_native_type,
	string_to_object,
} from '../../lib/DocsValidation';
import Ajv, {
	SchemaObject,
} from 'ajv/dist/2020';

type definitions = {
	[key: string]: [string, unknown][]
};

describe('DefaultConfig', () => {
	it('getter', () => {
		expect(default_config.ajv).not.toEqual(default_config.ajv);
	});
	it('setter', () => {
		const default_ajv = default_config.ajv;
		default_config.ajv = default_ajv;
		expect(default_config.ajv).toEqual(default_ajv);
		default_config.clear();
		expect(default_config.ajv).not.toEqual(default_config.ajv);
	});
})

const spec:{
	string_to_array: definitions,
	string_to_object: definitions,
	string_to_native_type: definitions,
} = {
	string_to_array: {
		'empty': [
			['', false],
			['()', false],
		],
		'with objects': [
			['((foo=bar))', [{foo: 'bar'}]],
			['(foo,"bar",(foo=bar))', ['foo', 'bar', {foo: 'bar'}]],
		],
		'with truncated object': [
			['((bar=)', ['(bar=']],
		],
	},
	string_to_object: {
		'empty': [
			['', false],
			['()', false],
		],
		'quoted and unquoted values': [
			['(foo=bar,bar=baz)', {foo: 'bar', bar: 'baz'}],
			['(foo="bar",bar=baz)', {foo: 'bar', bar: 'baz'}],
			['(foo=bar,bar="baz")', {foo: 'bar', bar: 'baz'}],
			['(foo="bar",bar="baz")', {foo: 'bar', bar: 'baz'}],
			['(foo=bar,bar=())', {foo: 'bar', bar: '()'}],
		],
		'nested objects': [
			['(foo=(bar="baz"))', {foo: {bar: 'baz'}}],
			['(foo=(bar=)', {foo: '(bar='}],
		],
	},
	string_to_native_type: {
		'empty': [
			['', ''],
			['()', '()'],
			['(())', ['()']],
		],
	},
};

const functions_to_call:{
	[key in keyof typeof spec]: (data:string) => unknown
} = {
	string_to_array,
	string_to_object,
	string_to_native_type,
};

for (const describing of Object.entries(spec)) {
	const [
		function_name,
		definitions,
	] = describing as [keyof typeof spec, definitions];
	const function_to_call = functions_to_call[function_name];

	describe(function_name, () => {
		for (const expectations of Object.entries(definitions)) {
			const [expectation, assertions] = expectations;

			it(expectation, () => {
				for (const assertion of assertions) {
					const [argument, to_equal] = assertion;
					expect(function_to_call(argument)).toEqual(to_equal);
				}
			});
		}
	});
}

describe('configure_ajv', () => {
	const test_keyword_schemas:[
		SchemaObject,
		[string, boolean][],
	][] = [
		[
			{
				type: 'string',
				minLength: 1,
				typed_object_string: {
					foo: {type: 'string', const: 'bar'},
				},
			},
			[
				['(foo=bar)', true],
				['(foo="bar")', true],
				['(foo=baz)', false],
			],
		],
		[
			{
				type: 'string',
				minLength: 1,
				'string_starts_with': 'foo',
			},
			[
				['foobar', true],
				['bar', false],
			],
		],
	];

	it('Ajv fails without use', () => {
		const ajv = new Ajv();
		const basic = ajv.compile({type: 'string'});

		expect(basic('foo')).toEqual(true);
		expect(basic(1)).toEqual(false);

		for (const entry of test_keyword_schemas) {
			const [schema] = entry;

			expect(() => {
				return ajv.compile(schema);
			}).toThrow();
		}
	});

	it('Behaves when configured', () => {
		const ajv = new Ajv();
		configure_ajv(ajv);

		for (const entry of test_keyword_schemas) {
			const [schema, checks] = entry;

			const check = ajv.compile(schema);

			for (const check_entry of checks) {
				const [input, expected] = check_entry;

				expect(check(input)).toEqual(expected);
			}
		}
	});
});


describe('ajv_is_configured', () => {
	it('not yet configured', () => {
		const ajv = new Ajv();

		expect(ajv_is_configured(ajv)).toBeFalse();

		configure_ajv(ajv);

		expect(ajv_is_configured(ajv)).toBeTrue();

		expect(ajv_is_configured(default_config.ajv)).toBeTrue();
	})
});
