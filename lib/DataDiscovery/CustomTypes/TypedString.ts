import {
	Generator as Base,
	ConvertsUnknown,
	ExpressionResult,
	RawGenerationResult,
} from '../Generator';
import {
	generate_object_parent_schema,
	generate_typed_string_definitions,
	typed_string_inner_array_type,
	typed_string_parent_type,
} from '../../CustomParsingTypes/TypedString';
import {
	SchemaObject,
	ValidateFunction,
} from 'ajv/dist/2020';
import {
	DataDiscovery,
} from '../../DataDiscovery';
import {
	is_string,
	local_ref,
} from '../../StringStartsWith';
import {
	object_has_non_empty_array_property,
	value_is_non_array_object,
} from '../../CustomParsingTypes/CustomPairingTypes';
import {
	ArrayLiteralExpression,
	ObjectLiteralExpression,
} from 'typescript';
import {
	NoMatchError,
} from '../../Exceptions';
import {
	string_to_array,
	string_to_object,
} from '../../DocsValidation';
import {
	is_UnrealEngineString_parent,
	UnrealEngineString_schema_definitions,
} from '../../CustomParsingTypes/UnrealEngineString';
import {
	compile,
} from '../../AjvUtilities';
import {
	UnrealEngineString,
} from './UnrealEngineString';
import {
	typed_string,
} from '../../TypeDefinitionDiscovery/CustomParsingTypes/typed_string';
import {
	typed_string_const,
} from '../../CustomParsingTypes/TypedStringConst';
import {
	typed_string_enum,
} from '../../CustomParsingTypes/TypedStringEnum';

export class TypedString extends ConvertsUnknown<
	string,
	ExpressionResult,
	typed_string_parent_type
> {
	private readonly check:Promise<
		ValidateFunction<typed_string_parent_type>
	>;
	private readonly definitions:Promise<{[key: string]: SchemaObject}>;
	private readonly UnrealEngineString:UnrealEngineString;

	constructor(discovery:DataDiscovery) {
		super(discovery);
		this.definitions = discovery.docs.schema().then(
			({definitions}) => {
				return {
					...UnrealEngineString_schema_definitions,
					...definitions,
				};
			}
		);

		this.check = this.definitions.then((definitions) => {
			const local_refs = Object.keys(definitions).map(local_ref);
			const schema = {
				...generate_object_parent_schema(),
				definitions: {
					...definitions,
					...generate_typed_string_definitions(local_refs),
				},
			};

			return compile<typed_string_parent_type>(
				discovery.docs.ajv,
				schema
			);
		});
		this.UnrealEngineString = new UnrealEngineString(discovery);
	}

	async convert_unknown(
		schema: typed_string_parent_type,
		raw_data: unknown
	): Promise<ExpressionResult<
		| ObjectLiteralExpression
		| ArrayLiteralExpression
	>> {
		if (!is_string(raw_data)) {
			throw new NoMatchError(raw_data, 'raw data not a string!');
		} else if (typed_string.is_object_type(schema.typed_string)) {
			const shallow = string_to_object(raw_data, true);

			if (false === shallow) {
				throw new NoMatchError(
					raw_data,
					'raw data not a typed_string'
				);
			} else if (value_is_non_array_object(shallow)) {
				return this.convert_object(schema, shallow);
			}
		}

		const shallow = string_to_array(raw_data, true);

		if (false === shallow) {
			throw new NoMatchError(
				raw_data,
				'raw data not a typed_string'
			);
		} else if (typed_string.is_array_type(schema.typed_string)) {
			return this.convert_array(schema.typed_string, shallow);
		}

		throw new NoMatchError(
			{
				raw_data,
				shallow,
			},
			'Failed to convert native type!'
		);
	}

	async matches(
		raw_data:unknown
	): Promise<RawGenerationResult<this>|undefined> {
		if (
			value_is_non_array_object(raw_data)
			&& (await this.check)(raw_data)
		) {
			return new RawGenerationResult(this);
		}

		return undefined;
	}

	private async convert_array(
		schema: typed_string_inner_array_type,
		shallow: unknown[]
	) : Promise<ExpressionResult<ArrayLiteralExpression>> {

		const definitions = await this.definitions;

		const check = compile<
			{[key: string]: unknown}
		>(
			this.discovery.docs.ajv,
			{
				...schema,
				definitions,
				type: 'array',
			}
		);

		if (!check(shallow)) {
			throw new NoMatchError(
				{
					shallow,
					schema,
					errors: check.errors,
				},
				'Shallow parse of typed_string does not match schema!'
			);
		}

		let converter:unknown = await (await Base.find(
			await this.discovery.candidates,
			schema.items
		)).result();

		if (
			!(converter instanceof ConvertsUnknown)
			&& is_UnrealEngineString_parent(
				schema.items
			)
		) {
			converter = this.UnrealEngineString;
		}

		if (
			!(converter instanceof ConvertsUnknown)
			&& object_has_non_empty_array_property(
				schema.items,
				'oneOf',
				value_is_non_array_object
			)
		) {
			const checks = schema.items.oneOf.map(
				(e) : [SchemaObject, ValidateFunction] => [
					e,
					compile(
						this.discovery.docs.ajv,
						e
					),
				]
			);

			const converted = await Promise.all(shallow.map(async (e) => {
				const schema = checks.find(maybe => maybe[1](e));

				if (!schema) {
					throw new NoMatchError(
						{
							shallow,
							e,
						}
					);
				}

				const schema_converter = await (await Base.find(
					await this.discovery.candidates,
					schema[0]
				)).result();

				if (!(schema_converter instanceof ConvertsUnknown)) {
					throw new NoMatchError(
						{
							schema: schema[0],
							shallow,
							e,
						}
					);
				}

				return await schema_converter.convert_unknown(
					schema[0],
					e
				) as unknown;
			}));

			return new ExpressionResult(
				await this.discovery.literal.value_literal(
					converted
				) as ArrayLiteralExpression
			) ;
		}

		if (
			!(converter instanceof ConvertsUnknown)
			&& typed_string_const.is_supported_schema(schema.items)
		) {
			const const_schema = schema.items;
			const checked = shallow.map((e, index) => {
				if (!is_string(e) || e !== const_schema.const) {
					throw new NoMatchError(
						{
							e,
							index,
							const_schema,
						},
						'Value not found on const!'
					);
				}

				return e;
			});

			return new ExpressionResult(
				await this.discovery.literal.value_literal(
					checked
				) as ArrayLiteralExpression
			);
		}

		if (
			!(converter instanceof ConvertsUnknown)
			&& typed_string_enum.is_supported_schema(schema.items)
		) {
			const enum_schema = schema.items;
			const checked = shallow.map((e, index) => {
				if (!is_string(e) || !enum_schema.enum.includes(e)) {
					throw new NoMatchError(
						{
							e,
							index,
							enum_schema,
						},
						'Value not found on enum!'
					);
				}

				return e;
			});

			return new ExpressionResult(
				await this.discovery.literal.value_literal(
					checked
				) as ArrayLiteralExpression
			);
		}

		if (converter instanceof ConvertsUnknown) {
			return new ExpressionResult(
				await this.discovery.literal.value_literal(
					await Promise.all(shallow.map(e => converter.convert_unknown(
						schema.items,
						e
					)))
				) as ArrayLiteralExpression
			);
		}

		throw new NoMatchError(
			{
				shallow,
				schema,
				converter,
			},
			'No converter found!'
		)
	}

	private async convert_object(
		schema: typed_string_parent_type,
		shallow:{[key: string]: unknown}
	) {
		const {typed_string: typed_string_value} = schema;

		if (!typed_string.is_object_type(typed_string_value)) {
			throw new NoMatchError(
				{
					schema,
					shallow,
				},
				'Array-typed passed to object conversion!'
			);
		}

		const definitions = await this.definitions;

		const check = compile<
			{[key: string]: unknown}
		>(
			this.discovery.docs.ajv,
			{
				...typed_string_value,
				definitions,
				type: 'object',
			}
		);

		if (!check(shallow)) {
			throw new NoMatchError(
				{
					shallow,
					schema,
					errors: check.errors,
				},
				'Shallow parse of typed_string does not match schema!'
			);
		}

		const converted = Object.fromEntries(await Promise.all(
			Object.entries(shallow).map(async (
				entry
			) : Promise<[string, unknown]> => {
				if (!(entry[0] in typed_string_value.properties)) {
					throw new NoMatchError(
						{
							[entry[0]]: entry[1],
							schema: typed_string_value.properties,
						},
						'Property not in schema!'
					);
				}

				const [property, value] = entry;
				const property_schema = typed_string_value.properties[
					property
				];

				let converter:unknown = await (await Base.find(
					await this.discovery.candidates,
					property_schema
				)).result();

				if (
					!(converter instanceof ConvertsUnknown)
					&& is_UnrealEngineString_parent(
						property_schema
					)
				) {
					converter = this.UnrealEngineString;
				}

				if (
					!(converter instanceof ConvertsUnknown)
					&& typed_string_const.is_supported_schema(
						property_schema
					)
				) {
					return [
						property,
						value,
					];
				}

				if (
					!(converter instanceof ConvertsUnknown)
					&& typed_string_enum.is_supported_schema(
						property_schema
					)
				) {
					if (
						!is_string(value)
						|| !property_schema.enum.includes(value)
					) {
						throw new NoMatchError(
							{
								[property]: value,
								schema: property_schema,
							},
							'Value not found on enum!'
						);
					}

					return [
						property,
						value,
					];
				}

				if (converter instanceof ConvertsUnknown) {
					return [
						property,
						await converter.convert_unknown(
							property_schema,
							value
						),
					];
				}

				throw new NoMatchError(
					{
						data: {[property]: value},
						schema: property_schema,
						converter,
					},
					'No converter found!'
				)
			})
		));

		try {
			return new ExpressionResult(
				await this.discovery.literal.object_literal(converted)
			);
		} catch (error) {
			throw new NoMatchError(
				{
					converted,
					error,
				},
				'Failed to grab object literal!'
			);
		}
	}
}