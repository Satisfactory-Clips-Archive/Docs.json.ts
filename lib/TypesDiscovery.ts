import {
	SchemaObject,
} from 'ajv/dist/2020';
import {
	object_has_property,
	value_is_non_array_object,
} from './CustomParsingTypes/CustomPairingTypes';
import {
	CandidatesDiscovery,
} from './TypesDiscovery/CandidatesDiscovery';
import {
	properties,
} from './TypesDiscovery/JsonSchema/properties';
import {
	non_empty_array_property,
} from './TypesDiscovery/non_empty_array_property';
import {
	$ref,
} from './TypesDiscovery/JsonSchema/$ref';
import {
	typed_object_string,
} from './TypesDiscovery/CustomParsingTypes/typed_object_string';
import {
	non_array_object_property,
} from './TypesDiscovery/non_array_object_property';
import {
	DocsDataItem, DocsTsGenerator,
} from './DocsTsGenerator';
import {
	compile,
} from './AjvUtilities';

export class TypesDiscovery
{
	private discovery:Promise<{
		discovered_types: string[],
		missed_types: string[],
	}>|undefined;
	private readonly candidates_discovery:[
		CandidatesDiscovery,
		...CandidatesDiscovery[],
	];
	private readonly docs:DocsTsGenerator;

	constructor(
		candidates_discovery: [CandidatesDiscovery, ...CandidatesDiscovery[]],
		docs: DocsTsGenerator,
	) {
		this.candidates_discovery = candidates_discovery;
		this.docs = docs;
	}

	async discover_types()
	{
		if (!this.discovery) {
			this.discovery = new Promise((yup, nope) => {
				this.docs.schema().then((schema) => {
					const discovered_types = new Set<string>();

					this.discover_types_from(schema, schema, discovered_types);

					yup({
						discovered_types: [...discovered_types.values()],
						missed_types: Object.keys(
							object_has_property(
								schema,
								'definitions',
								value_is_non_array_object
							)
								? schema.definitions
								: {}
						).map((key) => `#/definitions/${key}`).filter(
							maybe => !discovered_types.has(maybe)
						),
					});
				}).catch(nope);
			});
		}

		return this.discovery;
	}

	private discover_types_from(
		current:unknown,
		schema:SchemaObject,
		discovered_types:Set<string>
	) {
		if (!value_is_non_array_object(current)) {
			return;
		}

		for (const discovery of this.candidates_discovery) {
			const candidates = discovery.discovery_candidates(
				current,
				discovered_types
			);

			if (candidates) {
				candidates.forEach(
					e => this.discover_types_from(e, schema, discovered_types)
				);
			}
		}
	}

	static custom_parsing_types(schema:SchemaObject): (
		[CandidatesDiscovery, ...CandidatesDiscovery[]]
	) {
		return [
			new typed_object_string(schema),
			new non_array_object_property('typed_array_string', schema),
		];
	}

	static async generate_is_NativeClass(
		docs:DocsTsGenerator
	) {
		const schema = await docs.schema();

		if (!object_has_property(
			schema,
			'definitions',
			value_is_non_array_object
		)) {
			throw new Error('Schema appears to have no definitions');
		}

		if (!object_has_property(
			schema.definitions,
			'NativeClass',
			value_is_non_array_object
		)) {
			throw new Error('Could not find NativeClass on provided schema!');
		}

		return compile<DocsDataItem>(docs.ajv, {
			definitions: schema.definitions,
			...schema.definitions.NativeClass,
		});
	}

	static standard_jsonschema_discovery(schema:SchemaObject): (
		[CandidatesDiscovery, ...CandidatesDiscovery[]]
	) {
		return [
			new non_empty_array_property('prefixItems', schema),
			new non_empty_array_property('oneOf', schema),
			new non_empty_array_property('anyOf', schema),
			new non_array_object_property('items', schema),
			new properties(schema),
			new $ref(schema),
		];
	}
}
