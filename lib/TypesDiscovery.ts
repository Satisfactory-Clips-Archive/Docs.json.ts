import Ajv, {
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
	configure_ajv,
} from './DocsValidation';
import {
	DocsDataItem,
} from './DocsTsGenerator';

export class TypesDiscovery
{
	private readonly ajv:Ajv;
	private readonly json:{[key: string]: unknown};
	private validated = false;
	private readonly candidates_discovery:[
		CandidatesDiscovery,
		...CandidatesDiscovery[],
	];
	private discovery:Promise<{
		discovered_types: string[],
		missed_types: string[],
	}>|undefined;

	constructor(
		ajv: Ajv,
		json:{[key: string]: unknown},
		candidates_discovery: [
			CandidatesDiscovery,
			...CandidatesDiscovery[],
		],
	) {
		this.ajv = ajv;
		this.json = json;
		this.candidates_discovery = candidates_discovery;
	}

	public async schema_from_json(): Promise<SchemaObject>
	{
		if (!this.validated) {
			const check = await this.ajv.validateSchema(
				this.json
			);

			if (!check) {
				throw new Error('Could not validate schema!');
			}

			this.validated = true;
		}

		return this.json;
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

	async discover_types()
	{
		if (!this.discovery) {
			this.discovery = new Promise((yup, nope) => {
				this.schema_from_json().then((schema) => {
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

	static custom_parsing_types(schema:SchemaObject): (
		[CandidatesDiscovery, ...CandidatesDiscovery[]]
	) {
		return [
			new typed_object_string(schema),
			new non_array_object_property('typed_array_string', schema),
		];
	}

	static async generate_is_NativeClass(
		ajv:Ajv,
		discovery:TypesDiscovery
	) {
		configure_ajv(ajv);

		const schema = await discovery.schema_from_json();

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

		return ajv.compile<DocsDataItem>({
			definitions: schema.definitions,
			...schema.definitions.NativeClass,
		});
	}
}
