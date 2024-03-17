import Ajv from 'ajv/dist/2020';
import {
	is_UnrealEngineStringReference_value,
	UnrealEngineStringReference,
	UnrealEngineStringReference_inner_schema,
	UnrealEngineStringReference_schema,
} from './UnrealEngineStringReference';
import schema from '../../schema/update8.schema.json' assert {type: 'json'};
import {
	TypesGeneration_concrete,
	TypesGenerationFromSchema,
} from '../TypesGeneration';
import {
	adjust_class_name,
	auto_constructor_property_types_from_generated_types,
	auto_constructor_property_types_from_generated_types_properties,
	create_literal_node_from_value,
	create_modifier,
	create_object_type,
	createClass,
	createClass__members__with_auto_constructor,
} from '../TsFactoryWrapper';
import {
	TypeNodeGeneration,
	TypeNodeGenerationResult,
	UnexpectedlyUnknownNoMatchError,
} from '../SchemaBasedResultsMatching/TypeNodeGeneration';
import ts, {Node, TypeLiteralNode, TypeReferenceNode} from 'typescript';
import {
	array_is_non_empty,
	object_has_property,
	object_only_has_that_property,
	value_is_array,
	value_is_non_array_object,
} from './CustomPairingTypes';
import {writeFile} from 'node:fs/promises';

const already_configured = new WeakSet<Ajv>();

const typed_object_string_property_regex = '^[A-Za-z][A-Za-z3]*$';
const typed_object_string_const_value_regex = '^[A-Za-z][A-Za-z]*$';
const typed_object_string_const_value_regex__native = new RegExp(
	typed_object_string_const_value_regex
);

const type_object_string_$ref_supported = {
	'#/definitions/EditorCurveData--item': true,
	'#/definitions/InfinityExtrap': true,
	'#/definitions/empty-object': true,
	'#/definitions/decimal-string': true,
	'#/definitions/decimal-string--signed': true,
	'#/definitions/integer-string': true,
	'#/definitions/integer-string--signed': true,
	'#/definitions/boolean': true,
	'#/definitions/quaternion--inner': true,
	'#/definitions/xyz--inner': true,
	'#/definitions/xy': true,
	'#/definitions/color': true,
	'#/definitions/color-decimal': true,
	'#/definitions/mDockingRuleSet': true,
	'#/definitions/mLightControlData': true,
	'#/definitions/mDisableSnapOn': true,
	'#/definitions/SpecifiedColor--inner': true,
	'#/definitions/Texture2D': true,
};
const type_object_string_$ref_supported_array = Object.keys(
	type_object_string_$ref_supported
) as (keyof typeof type_object_string_$ref_supported)[];

type type_object_string_$ref_choices = {
	$ref: keyof typeof type_object_string_$ref_supported;
};

type typed_object_string_$ref_only = {
	[key: string]: type_object_string_$ref_choices;
};

type typed_object_string_type = {
	[key: string]:
		| {
				type: 'string';
				const: string;
		  }
		| type_object_string_$ref_choices
		| typed_object_string_$ref_only;
};

type typed_object_string_general_type = {
	type: 'string';
	typed_object_string: typed_object_string_type;
} & ({minLength: 1} | {});

type typed_object_string_nested_type = {
	type: 'string';
	typed_object_string: {[key: string]: typed_object_string_general_type};
} & ({minLength: 1} | {});

type typed_object_string_array_type = [
	typed_object_string_general_type,
	...typed_object_string_general_type[],
];

type typed_object_string_combination_dictionary = {
	[key: string]:
		| type_object_string_$ref_choices
		| {type: 'string'; const: string}
		| typed_object_string_$ref_only
		| typed_object_string_combination_dictionary;
};

const typed_object_string_$ref_schema = {
	type: 'object',
	required: ['$ref'],
	additionalProperties: false,
	properties: {
		$ref: {
			type: 'string',
			enum: [
				'#/definitions/EditorCurveData--item',
				'#/definitions/InfinityExtrap',
				'#/definitions/empty-object',
				'#/definitions/decimal-string',
				'#/definitions/decimal-string--signed',
				'#/definitions/integer-string',
				'#/definitions/integer-string--signed',
				'#/definitions/boolean',
				'#/definitions/quaternion--inner',
				'#/definitions/xyz--inner',
				'#/definitions/xy',
				'#/definitions/color',
				'#/definitions/color-decimal',
				'#/definitions/mDockingRuleSet',
				'#/definitions/mLightControlData',
				'#/definitions/mDisableSnapOn',
				'#/definitions/SpecifiedColor--inner',
				'#/definitions/Texture2D',
			],
		},
	},
};

export const typed_object_supported_const_string_schema = {
	type: 'object',
	required: ['type', 'const'],
	additionalProperties: false,
	properties: {
		type: {type: 'string', const: 'string'},
		const: {
			type: 'string',
			pattern: typed_object_string_const_value_regex,
		},
	},
};

export const typed_object_string_schema = {
	type: 'object',
	additionalProperties: false,
	patternProperties: {
		[typed_object_string_property_regex]: {
			oneOf: [
				typed_object_string_$ref_schema,
				{
					type: 'object',
					additionalProperties: false,
					patternProperties: {
						[typed_object_string_property_regex]: {
							oneOf: [
								typed_object_string_$ref_schema,
								typed_object_supported_const_string_schema,
							],
						},
					},
				},
				UnrealEngineStringReference_inner_schema,
				typed_object_supported_const_string_schema,
			],
		},
	},
};

export const typed_object_string_general_schema = {
	type: 'object',
	required: ['type', 'typed_object_string'],
	definitions: UnrealEngineStringReference_schema.definitions,
	additionalProperties: false,
	properties: {
		type: {type: 'string', const: 'string'},
		minLength: {type: 'number', const: 1},
		typed_object_string: typed_object_string_schema,
	},
};
export const typed_object_string_nested_schema = {
	type: 'object',
	required: ['type', 'typed_object_string'],
	definitions: UnrealEngineStringReference_schema.definitions,
	additionalProperties: false,
	properties: {
		type: {type: 'string', const: 'string'},
		minLength: {type: 'number', const: 1},
		typed_object_string: {
			type: 'object',
			patternProperties: {
				[typed_object_string_property_regex]: {
					type: 'object',
					additionalProperties: false,
					patternProperties: {
						[typed_object_string_property_regex]:
							typed_object_string_$ref_schema,
					},
				},
			},
		},
	},
};

export const typed_object_oneOf_schema = {
	type: 'object',
	required: ['oneOf'],
	definitions: UnrealEngineStringReference_schema.definitions,
	additionalProperties: false,
	properties: {
		oneOf: {
			type: 'array',
			minItems: 1,
			items: typed_object_string_general_schema,
		},
	},
};

const supported_type_node_generations = {
	type: 'object',
	required: ['$ref'],
	additionalProperties: false,
	properties: {
		$ref: {
			type: 'string',
			enum: [
				'#/definitions/transformation',
				'#/definitions/color',
				'#/definitions/color-decimal',
				'#/definitions/mDockingRuleSet',
				'#/definitions/mLightControlData',
				'#/definitions/mDisableSnapOn',
				'#/definitions/SpecifiedColor--inner',
				'#/definitions/Texture2D',
			],
		},
	},
};

type supported_type_node_generations = {
	$ref:
		| '#/definitions/SpecifiedColor--inner'
		| '#/definitions/Texture2D'
		| '#/definitions/transformation'
		| '#/definitions/color'
		| '#/definitions/color-decimal'
		| '#/definitions/mDockingRuleSet'
		| '#/definitions/mLightControlData'
		| '#/definitions/mDisableSnapOn';
};

export class TypedObjectString {
	static configure_ajv(ajv: Ajv) {
		if (already_configured.has(ajv)) {
			return;
		}

		already_configured.add(ajv);

		ajv.addKeyword({
			keyword: 'typed_object_string',
			type: 'string',
			metaSchema: {
				...typed_object_string_schema,
				...{
					definitions:
						UnrealEngineStringReference_schema.definitions,
				},
			},
			macro: this.ajv_macro_generator(false),
		});
	}

	private static typed_object_string_$ref_to_regex(
		property: string,
		value: type_object_string_$ref_choices
	): string {
		const {$ref} = value;

		let value_regex = '(?:True|False)';

		if ('#/definitions/InfinityExtrap' === $ref) {
			value_regex = 'RCCE_Constant';
		} else if ('#/definitions/empty-object' === $ref) {
			value_regex = '\\(\\)';
		} else if ('#/definitions/EditorCurveData--item' === $ref) {
			if (
				!this.is_$ref_object_dictionary(
					schema.definitions['EditorCurveData--item']
				)
			) {
				throw new Error(`${$ref} not supported!`);
			}

			value_regex = this.property_to_regex(
				schema.definitions['EditorCurveData--item']
			);
		} else if (
			supported_type_node_generations.properties.$ref.enum.includes($ref)
		) {
			const definition =
				schema.definitions[
					$ref.substring(14) as keyof typeof schema.definitions &
						(
							| 'quaternion--inner'
							| 'xyz--inner'
							| 'xy'
							| 'color'
							| 'color-decimal'
							| 'mDockingRuleSet'
							| 'mLightControlData'
							| 'mDisableSnapOn'
							| 'SpecifiedColor--inner'
							| 'Texture2D'
						)
				];

			const is_typed_object_array =
				this.object_is_typed_object_string_oneOf(definition);
			const object_has_typed_object_string =
				object_has_property(definition, 'typed_object_string') &&
				this.is_$ref_object_dictionary(definition.typed_object_string);

			if (!is_typed_object_array && !object_has_typed_object_string) {
				throw new UnexpectedlyUnknownNoMatchError(
					{definition},
					'typed_object_string property not usable!'
				);
			}

			if (is_typed_object_array) {
				value_regex = `(?:${definition.oneOf
					.map((e) => e.typed_object_string)
					.map((e, index) => {
						if (!this.is_$ref_object_dictionary(e)) {
							throw new UnexpectedlyUnknownNoMatchError(
								e,
								`${property}.oneOf[${index}] not an object dictionary!`
							);
						}

						return this.property_to_regex(e);
					})
					.join('|')})`;
			} else if (
				!this.is_$ref_object_dictionary(definition.typed_object_string)
			) {
				throw new UnexpectedlyUnknownNoMatchError(
					{definition},
					'typed_object_string property not usable!'
				);
			} else {
				value_regex = this.property_to_regex(
					definition.typed_object_string
				);
			}
		} else if ('#/definitions/boolean' !== $ref) {
			if ($ref === undefined) {
				console.log(property, value);

				throw new Error('foo');
			}
			if ($ref.startsWith('#/definitions/decimal-string')) {
				value_regex = '\\d+\\.\\d+';
			} else {
				value_regex = '\\d+';
			}

			if ($ref.endsWith('--signed')) {
				value_regex = `-?${value_regex}`;
			}
		}

		return `${property}=${value_regex}`;
	}

	private static keys_are_$ref_only(keys: string[]): keys is ['$ref'] {
		return 1 === keys.length && keys.includes('$ref');
	}

	private static is_$ref_object(
		maybe: any
	): maybe is type_object_string_$ref_choices {
		return (
			'object' === typeof maybe &&
			this.keys_are_$ref_only(Object.keys(maybe)) &&
			type_object_string_$ref_supported_array.includes(maybe.$ref)
		);
	}

	private static is_supported_const_string_object(
		maybe: any
	): maybe is {type: 'string'; const: string} {
		return (
			'object' === typeof maybe &&
			2 === Object.keys(maybe).length &&
			object_has_property(maybe, 'type') &&
			'string' === maybe.type &&
			object_has_property(maybe, 'const') &&
			typed_object_string_const_value_regex__native.test(maybe.const)
		);
	}

	private static is_$ref_object_dictionary(maybe: {
		[key: string]: any;
	}): maybe is typed_object_string_$ref_only {
		for (const sub_object of Object.values(maybe)) {
			if (!this.is_$ref_object(sub_object)) {
				return false;
			}
		}

		return 0 !== Object.keys(maybe).length;
	}

	private static is_combination_dictionary(
		maybe: any,
		current_depth = 0
	): maybe is typed_object_string_combination_dictionary {
		if (!value_is_non_array_object(maybe)) {
			return false;
		}

		if (current_depth > 10) {
			throw new UnexpectedlyUnknownNoMatchError(
				maybe,
				'Cannot exceed 10 levels of recursion!'
			);
		}

		const failed = Object.values(maybe).filter(
			(e) =>
				!this.is_$ref_object(e) &&
				!this.is_supported_const_string_object(e) &&
				!this.is_$ref_object_dictionary(e) &&
				!this.is_combination_dictionary(e, current_depth + 1)
		);

		return Object.keys(maybe).length >= 1 && failed.length === 0;
	}

	private static $ref_object_dictionary_is_auto_constructor_properties(maybe: {
		[key: string]: type_object_string_$ref_choices;
	}): maybe is typeof maybe &
		auto_constructor_property_types_from_generated_types_properties<
			Exclude<keyof typeof maybe, number>
		> {
		return (
			Object.keys(maybe).length >= 1 &&
			Object.values(maybe).every((value) => {
				return (
					value.$ref in
					auto_constructor_property_types_from_generated_types
				);
			})
		);
	}

	private static value_is_typed_object_string_general_type(
		maybe: any
	): maybe is typed_object_string_general_type {
		return (
			'object' === typeof maybe &&
			object_has_property(maybe, 'type') &&
			'string' === maybe.type &&
			object_has_property(maybe, 'typed_object_string') &&
			this.is_$ref_object_dictionary(maybe.typed_object_string) &&
			(2 === Object.keys(maybe).length ||
				(3 === Object.keys(maybe).length &&
					object_has_property(maybe, 'minLength') &&
					1 === maybe.minLength))
		);
	}

	private static array_is_typed_object_string_general_type_array(
		maybe: any[]
	): maybe is typed_object_string_general_type[] {
		return maybe.every(this.value_is_typed_object_string_general_type);
	}

	private static object_is_typed_object_string_oneOf(
		maybe: object
	): maybe is {
		oneOf: typed_object_string_array_type;
	} {
		return (
			!object_only_has_that_property(maybe, 'oneOf') ||
			!value_is_array(maybe.oneOf) ||
			!this.array_is_typed_object_string_general_type_array(
				maybe.oneOf
			) ||
			!array_is_non_empty(maybe.oneOf)
		);
	}

	private static property_to_regex(data: typed_object_string_type): string {
		return `\\(${Object.entries(data)
			.map((entry) => {
				if (this.is_$ref_object(entry[1])) {
					return this.typed_object_string_$ref_to_regex(
						entry[0],
						entry[1]
					);
				}

				if (
					'UnrealEngineStringReference--inner' in entry[1] &&
					is_UnrealEngineStringReference_value(
						entry[1]['UnrealEngineStringReference--inner']
					)
				) {
					return `${entry[0]}=${
						UnrealEngineStringReference.ajv_macro_generator(true)(
							entry[1]['UnrealEngineStringReference--inner']
						).pattern
					}`;
				} else if ('UnrealEngineStringReference--inner' in entry[1]) {
					console.error(entry[0], entry[1]);
					throw new Error(
						'Not a UnrealEngineStringReference--inner'
					);
				}

				return `${entry[0]}=\\(${Object.entries(entry[1])
					.map((sub_entry) => {
						const [sub_property, sub_value] = sub_entry;

						return this.typed_object_string_$ref_to_regex(
							sub_property,
							sub_value
						);
					})
					.join(',')}\\)`;
			})
			.join(',')}\\)`;
	}

	static ajv_macro_generator(inner: boolean) {
		return (schema: typed_object_string_type) => {
			const regex = `^${this.property_to_regex(schema)}`;

			return {
				pattern: inner ? regex : `^${regex}$`,
			};
		};
	}

	static TypesGenerators(): [
		TypesGeneration_concrete,
		...TypesGeneration_concrete[],
	] {
		return [
			new TypesGenerationFromSchema<typed_object_string_general_type>(
				typed_object_string_general_schema,
				(data, reference_name) => {
					if (
						!this.is_$ref_object_dictionary(
							data.typed_object_string
						)
					) {
						console.log(data.typed_object_string);
						throw new UnexpectedlyUnknownNoMatchError(
							data.typed_object_string,
							'not yet supported in type generation for general schema'
						);
					} else if (
						!this.$ref_object_dictionary_is_auto_constructor_properties(
							data.typed_object_string
						)
					) {
						return ts.factory.createTypeAliasDeclaration(
							[create_modifier('export')],
							adjust_class_name(reference_name),
							undefined,
							create_object_type(
								Object.fromEntries(
									Object.entries(
										data.typed_object_string
									).map((entry) => {
										return [
											entry[0],
											ts.factory.createTypeReferenceNode(
												adjust_class_name(
													entry[1].$ref.substring(14)
												)
											),
										];
									})
								)
							)
						);
					}

					return createClass(
						adjust_class_name(reference_name),
						createClass__members__with_auto_constructor(
							{
								type: 'object',
								required: Object.keys(
									data.typed_object_string
								) as [string, ...string[]],
								properties: data.typed_object_string,
							},
							['public', 'readonly']
						),
						{
							modifiers: ['export'],
						}
					);
				}
			),
			new TypesGenerationFromSchema<{
				oneOf: typed_object_string_array_type;
			}>(typed_object_oneOf_schema, (data, reference_name) => {
				return ts.factory.createTypeAliasDeclaration(
					[create_modifier('export')],
					adjust_class_name(reference_name),
					undefined,
					ts.factory.createUnionTypeNode(
						data.oneOf.map((e, index) => {
							return create_object_type(
								Object.fromEntries(
									Object.entries(e.typed_object_string).map(
										(entry) => {
											if (
												!this.is_$ref_object(entry[1])
											) {
												throw new UnexpectedlyUnknownNoMatchError(
													entry,
													`${reference_name}.oneOf[${index}][${entry[0]}] not supported!`
												);
											}

											return [
												entry[0],
												ts.factory.createTypeReferenceNode(
													adjust_class_name(
														entry[1].$ref.substring(
															14
														)
													)
												),
											];
										}
									)
								)
							);
						})
					)
				);
			}),
			new TypesGenerationFromSchema<typed_object_string_nested_type>(
				typed_object_string_nested_schema,
				(data, reference_name) => {
					return createClass(
						adjust_class_name(reference_name),
						createClass__members__with_auto_constructor(
							{
								type: 'object',
								required: Object.keys(
									data.typed_object_string
								) as [string, ...string[]],
								properties: Object.fromEntries(
									Object.entries(
										data.typed_object_string
									).map((e) => {
										const [property, value] = e;

										if (
											!this.is_$ref_object_dictionary(
												value
											) ||
											!this.$ref_object_dictionary_is_auto_constructor_properties(
												value
											)
										) {
											throw new UnexpectedlyUnknownNoMatchError(
												value,
												`${reference_name}[${property}] not supported!`
											);
										}

										return [property, value];
									})
								) as any,
							},
							['public', 'readonly']
						),
						{
							modifiers: ['export'],
						}
					);
				}
			),
		];
	}

	static CustomGenerators(): [
		{file: string; node: Node},
		...{file: string; node: Node}[],
	] {
		return [
			{
				file: 'classes/base.ts',
				node: ts.factory.createTypeAliasDeclaration(
					[create_modifier('declare')],
					'EditorCurveData__item',
					undefined,
					ts.factory.createTypeReferenceNode('EditorCurveData')
				),
			},
		];
	}

	private static combination_dictionary_type_to_object_type(
		data: typed_object_string_combination_dictionary
	): TypeLiteralNode {
		return create_object_type(
			Object.fromEntries(
				Object.entries(data).map((entry) => {
					const [property, value] = entry;

					if (this.is_$ref_object(value)) {
						return this.$ref_choice_to_object_type_entry(
							property,
							value
						);
					} else if (this.is_supported_const_string_object(value)) {
						return [
							property,
							create_literal_node_from_value(value.const),
						];
					} else {
					}
					throw new UnexpectedlyUnknownNoMatchError(
						value,
						`${property} not yet supported in combination_dictionary_type_to_object_type`
					);
				})
			)
		);
	}

	private static general_type_to_object_type(
		data: typed_object_string_general_type
	): TypeLiteralNode {
		return create_object_type(
			Object.fromEntries(
				Object.entries(data.typed_object_string).map((entry) => {
					const [property, value] = entry;

					if (this.is_supported_const_string_object(value)) {
						return [
							property,
							create_literal_node_from_value(value.const),
						];
					} else if (this.is_$ref_object_dictionary(value)) {
						return [
							property,
							create_object_type(
								Object.fromEntries(
									Object.entries(value).map(
										(inner_entry) => {
											return this.$ref_choice_to_object_type_entry(
												inner_entry[0],
												inner_entry[1]
											);
										}
									)
								)
							),
						];
					} else if (this.is_combination_dictionary(value)) {
						return [
							property,
							this.combination_dictionary_type_to_object_type(value),
						];
					} else if (!this.is_$ref_object(value)) {
						throw new UnexpectedlyUnknownNoMatchError(
							{[property]: value},
							'not yet supported in general type to object type'
						);
					}

					return this.$ref_choice_to_object_type_entry(
						property,
						value
					);
				})
			)
		);
	}

	private static $ref_choice_to_object_type_entry<T extends string = string>(
		property: T,
		value: type_object_string_$ref_choices
	): [T, TypeReferenceNode] {
		return [
			property,
			ts.factory.createTypeReferenceNode(
				adjust_class_name(value.$ref.substring(14))
			),
		];
	}

	static TypeNodeGeneration(): [
		TypeNodeGeneration<any>,
		...TypeNodeGeneration<any>[],
	] {
		return [
			new TypeNodeGeneration<typed_object_string_nested_type>(
				typed_object_string_nested_schema,
				(data) => {
					return new TypeNodeGenerationResult(() => {
						return create_object_type(
							Object.fromEntries(
								Object.entries(data.typed_object_string).map(
									(e) => {
										if (
											!this.is_$ref_object_dictionary(
												e[1]
											)
										) {
											throw new UnexpectedlyUnknownNoMatchError(
												e[1],
												`${e[0]} not a supported type!`
											);
										}

										return [
											e[0],
											this.general_type_to_object_type({
												type: 'string',
												typed_object_string: e[1],
											}),
										];
									}
								)
							)
						);
					});
				}
			),
			new TypeNodeGeneration<typed_object_string_general_type>(
				typed_object_string_general_schema,
				(data) => {
					const is_$ref_object_dictionary =
						this.is_$ref_object_dictionary(
							data.typed_object_string
						);
					const is_combination_dictionary = this.is_combination_dictionary(
						data.typed_object_string
					);

					if (!is_$ref_object_dictionary && !is_combination_dictionary) {
						throw new UnexpectedlyUnknownNoMatchError(
							data.typed_object_string,
							'not yet supported in type node generation'
						);
					}

					return new TypeNodeGenerationResult(() =>
						this.general_type_to_object_type(data)
					);
				}
			),
			new TypeNodeGeneration<supported_type_node_generations>(
				supported_type_node_generations,
				(data) => {
					return new TypeNodeGenerationResult(() =>
						ts.factory.createTypeReferenceNode(
							adjust_class_name(data.$ref.substring(14))
						)
					);
				}
			),
		];
	}
}