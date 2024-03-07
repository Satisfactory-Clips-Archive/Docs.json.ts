import schema from '../../schema/update8.schema.json' assert {type: 'json'};
import {
	TypeNodeGenerationMatcher,
	create_constructor_args,
	create_binding_constructor,
} from '../TypeNodeGeneration';
import {type_node_generators as enum_type_node_generators} from '../TypesGeneration/enum';
import {type_node_generators as const_type_node_generators} from '../TypesGeneration/constants';
import {type_node_generators as validators_type_node_generators} from '../TypesGeneration/validators';
import {type_node_generators as vectors_type_node_generators} from '../TypesGeneration/vectors';
import {type_node_generators as color_type_node_generators} from '../TypesGeneration/color';
import {type_node_generators as arrays_type_node_generators} from '../TypesGeneration/arrays';
import {type_node_generators as prefixes_type_node_generators} from '../TypesGeneration/prefixes';
import {supported_base_classes, type_node_generators} from '../TypesGeneration/Classes';
import {dirname} from 'node:path';
import {
	adjust_class_name, adjust_unrealengine_prefix, adjust_unrealengine_value, create_class_options,
	create_modifier, createClass, createProperty,
	createProperty_with_specific_type,
	supported_modifiers
} from '../TsFactoryWrapper';
import ts from 'typescript';
import {default_config, extract_UnrealEngineString} from '../DocsValidation';
import {import_these_later, ImportTracker} from '../TypesGeneration';

declare type object_with_ref = {'$ref': string};

declare type NativeClass = {
	type: 'object',
	required: [
		'NativeClasses',
		'Classes',
	],
	additionalProperties: false,
	properties: {
		NativeClass: {
			type: 'string',
			const: string,
		},
		Classes: {
			type: 'array',
			items: object_with_ref|{oneOf: object_with_ref[]}|{anyOf: object_with_ref[]},
		} | {
			type: 'array',
			minItems: number,
			maxItems: number,
			prefixItems: [object_with_ref, ...object_with_ref[]],
			items: object_with_ref|false,
		} | {
			type: 'array',
			prefixItems: [object_with_ref, ...object_with_ref[]],
		},
	},
};

export function type_node_generation_matcher() : TypeNodeGenerationMatcher
{
	return new TypeNodeGenerationMatcher([
		...enum_type_node_generators,
		...const_type_node_generators,
		...validators_type_node_generators,
		...vectors_type_node_generators,
		...color_type_node_generators,
		...arrays_type_node_generators,
		...type_node_generators,
		...prefixes_type_node_generators,
	]);
}

export function get_dependency_tree(ref:keyof typeof schema.definitions) : string[] {
	const ancestry:string[] = [ref];

	let checking = schema.definitions[ref];

	while ('$ref' in checking && checking['$ref'].startsWith('#/definitions/')) {
		ancestry.push(checking['$ref'].substring(14));

		const next_reference_name:string = checking['$ref'].substring(14);

		if (next_reference_name in schema.definitions) {
			checking = schema.definitions[check_ref(next_reference_name)];
		}
	}

	return ancestry;
}

export function check_ref(ref:string) : keyof typeof schema.definitions
{
	if (!(ref in schema.definitions)) {
		throw new Error(`${ref} not in the update 8 schema!`);
	}

	return ref as keyof typeof schema.definitions;
}

export function build_abstracts(
	ref:keyof typeof schema.definitions,
	filename:string,
	imports:import_these_later,
	abstracts:string[],
	other_filenames:{[key: string]: string}
) : string[] {
	const tree = get_dependency_tree(ref);
	const parent_ref = tree[1];

	if (!parent_ref) {
		throw new Error('foo');
	}

	if (parent_ref in other_filenames && filename !== other_filenames[parent_ref]) {
		const other_filename = other_filenames[parent_ref];
		const other_class = adjust_class_name(parent_ref);

		if ( ! (filename in imports)) {
			imports[filename] = {};
		}

		if ( ! (other_filename in imports[filename])) {
			imports[filename][other_filename] = [];
		}

		if ( ! imports[filename][other_filename].includes(other_class)) {
			imports[filename][other_filename].push(other_class);
		}
	}

	const [, ...ancestors] = tree;

	for (const probably_abstract of ancestors) {
		if (!abstracts.includes(probably_abstract)) {
			abstracts.push(probably_abstract);
		}
	}

	return abstracts;
}

export function generate_class(
	ref:keyof typeof schema.definitions,
	filename:string,
	type_node_generator:TypeNodeGenerationMatcher,
	imports:import_these_later,
	classes:{file: string, node:ts.Node, ref:string}[],
	abstracts:string[]
) : [{ref: string, file: string, node:ts.Node}[], string[]] {

	const path_relative = '../'.repeat(dirname(filename).split('/').length);

	const class_name = adjust_class_name(ref);

	const tree = get_dependency_tree(ref);
	const parent_ref = tree[1];

	if (!parent_ref) {
		throw new Error('foo');
	}

	const modifiers:supported_modifiers[] = ['export'];

	if (abstracts.includes(ref)) {
		modifiers.push('abstract');
	}

	const members:ts.ClassElement[] = [];

	const data = schema.definitions[ref];

	if ('$ref' in data || 'required' in data) {
		classes.push({...create_constructor_args(filename, class_name, data), ref});
	}

	if ('properties' in data) {
		const types = type_node_generator.find_from_properties(
			default_config.ajv,
			data.properties
		);

		TypeNodeGenerationMatcher.merge_imports(
			filename,
			path_relative,
			Object.values(types),
			imports
		);

		const required_properties = 'required' in data ? data.required : [];

		members.push(...Object.entries(types).map((entry) => {
			const [property, generator] = entry;
			TypeNodeGenerationMatcher.merge_import_singular(
				filename,
				path_relative,
				generator,
				imports
			);

			return createProperty_with_specific_type(
				property,
				required_properties.includes(property) ? ts.factory.createUnionTypeNode([
					generator.type(),
					ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
				]) : generator.type(),
				['public']
			);
		}));
	}

	if ('$ref' in data || 'required' in data) {
		members.push(create_binding_constructor(ref, data));
	}

	classes.push({
		ref,
		file: filename,
		node: ts.factory.createClassDeclaration(
			modifiers.map((modifier) => create_modifier(modifier)),
			class_name,
			undefined,
			[
				ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
					ts.factory.createExpressionWithTypeArguments(
						ts.factory.createIdentifier(adjust_class_name(parent_ref)),
						undefined
					),
				])
			],
			members,
		),
	});

	return [classes, abstracts];
}


export const custom_generators = [
	() : {file: string, node:ts.Node, ref?:string}[] => {
		const output:{file: string, node:ts.Node, ref?:string}[] = [];

		output.push(...supported_base_classes.map((reference_name) => {
			return create_constructor_args('classes/base.ts', reference_name, schema.definitions[reference_name]);
		}));

		output.push(...supported_base_classes.map((reference_name) => {
			const data = schema.definitions[reference_name];

			const members:(ts.PropertyDeclaration|ts.MethodDeclaration)[] = data.required.map((property) => {
				return createProperty(property, ts.SyntaxKind.StringKeyword, [
					'public',
				]);
			});

			members.push(create_binding_constructor(
				reference_name,
				data
			));

			const class_options:create_class_options = {
				modifiers: ['abstract'],
			};

			if ('$ref' in data && data['$ref']?.startsWith('#/definitions/')) {
				class_options.extends = data['$ref'].substring(14);
			}

			return {
				file: 'classes/base.ts',
				refs: reference_name,
				node: createClass(reference_name, members, class_options),
			};
		}));

		return output;
	},
	() : {file: string, node:ts.Node, ref:string}[] => {
		const checked:string[] = [];

		const filenames:{[key: string]: string} = {};
		const imports:import_these_later = {};

		let classes:{file: string, node:ts.Node, ref:string}[] = [];

		let abstracts:string[] = [];

		const type_node_generator = type_node_generation_matcher();

		function populate_checked_and_filenames(ref:string, NativeClass:NativeClass) {
			if (checked.includes(ref)) {
				return;
			}

			checked.push(ref);

			const {prefix, value} = extract_UnrealEngineString(NativeClass.properties.NativeClass.const);

			const definition_name = ref.substring(14);

			filenames[definition_name] = `classes/${adjust_unrealengine_prefix(prefix)}/${adjust_unrealengine_value(value)}.ts`;
		}

		for (const NativeClass of (schema.prefixItems as [NativeClass, ...NativeClass[]])) {
			let found_some = false;
			if (
				'items' in NativeClass.properties.Classes
				&& false !== NativeClass.properties.Classes.items
			) {
				if ('$ref' in NativeClass.properties.Classes.items) {
					found_some = true;
					populate_checked_and_filenames(NativeClass.properties.Classes.items['$ref'], NativeClass);
				} else if ('oneOf' in NativeClass.properties.Classes.items) {
					for (const entry of NativeClass.properties.Classes.items.oneOf) {
						found_some = true;
						populate_checked_and_filenames(entry['$ref'], NativeClass);
					}
				} else if ('anyOf' in NativeClass.properties.Classes.items) {
					for (const entry of NativeClass.properties.Classes.items.anyOf) {
						found_some = true;
						populate_checked_and_filenames(entry['$ref'], NativeClass);
					}
				}
			}

			if (
				'prefixItems' in NativeClass.properties.Classes
			) {
				for (const entry of NativeClass.properties.Classes.prefixItems) {
					found_some = true;
					populate_checked_and_filenames(entry['$ref'], NativeClass);
				}
			}

			if (!found_some) {
				console.error(NativeClass);

				throw new Error('whut');
			}
		}

		for (const entry of Object.entries(filenames)) {
			const [ref, filename] = entry;

			abstracts = build_abstracts(check_ref(ref), filename, imports, abstracts, filenames);
		}

		for (const entry of Object.entries(filenames)) {
			const [ref, filename] = entry;

			[classes, abstracts] = generate_class(
				check_ref(ref),
				filename,
				type_node_generator,
				imports,
				classes,
				abstracts,
			);
		}

		ImportTracker.merge_and_set_imports(imports);

		return classes;
	},
];
