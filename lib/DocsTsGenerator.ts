import {mkdir, readFile, unlink, writeFile} from 'node:fs/promises';
import {basename, dirname} from 'node:path';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

import * as prettier from 'prettier';
import Ajv, {ErrorObject} from 'ajv/dist/2020';

import update8_schema from '../schema/update8.schema.json' assert {type: 'json'};

import {
	target_files as color_target_files,
	generators as color_generators,
	type_node_generators as color_type_node_generators,
} from './TypesGeneration/color';
import {
	target_files as enum_target_files,
	generators as enum_generators,
	type_node_generators as enum_type_node_generators,
} from './TypesGeneration/enum';
import {
	target_files as validator_target_files,
	generators as validator_generators,
	custom_generators as validator_custom_generators,
	type_node_generators as validators_type_node_generators,
} from './TypesGeneration/validators';
import {
	target_files as vectors_target_files,
	generators as vectors_generators,
	custom_generators as vectors_custom_generators,
	supported_meta_types as vectors_supported_meta_types,
	type_node_generators as vectors_type_node_generators,
} from './TypesGeneration/vectors';
import {
	target_files as constants_target_files,
	generators as constants_generators,
	type_node_generators as const_type_node_generators,
} from './TypesGeneration/constants';
import {
	target_files as prefixes_target_files,
	generators as prefixes_generators,
	type_node_generators as prefixes_type_node_generators,
} from './TypesGeneration/prefixes';
import {
	target_files as unions_target_files,
	generators as unions_generators,
	type_node_generators as unions_type_node_generators,
} from './TypesGeneration/unions';
import {
	TypesGenerationFromSchema,
	TypesGenerationMatchesReferenceName,
	GenerationMatch,
	ImportTracker,
} from './TypesGeneration';
import {default_config} from './DocsValidation';
import ts from 'typescript';
import {glob} from 'glob';
import {BuiltInParserName} from 'prettier';
import {
	target_files as classes_target_files,
	generators as classes_generators,
	supported_base_classes as Classes_supported_base_classes,
	type_node_generators,
} from './TypesGeneration/Classes';
import {
	target_files as arrays_target_files,
	generators as arrays_generators,
	type_node_generators as arrays_type_node_generators,
} from './TypesGeneration/arrays';
import {
	target_files as aliases_target_files,
	generators as aliases_generators,
	type_node_generators as aliases_type_node_generators,
} from './TypesGeneration/aliases';
import {is_ref, Update8TypeNodeGeneration} from './Schemas/Update8';
import {TypeNodeGenerationMatcher} from './TypeNodeGeneration';
import {DocsTsAutoImports} from './DocsTsAutoImports';

const __dirname = dirname(fileURLToPath(import.meta.url));

class ValidationError extends Error {
	readonly errors: ErrorObject[];
	readonly json: any;

	constructor(
		message: string,
		errors: ErrorObject[] | undefined | null,
		json: any
	) {
		super(message);
		this.errors = errors || [];
		this.json = json;
	}
}

export class GenerationException {
	readonly progress: generation_result;
	readonly exception: unknown;

	constructor(progress: generation_result, exception: unknown) {
		this.progress = progress;
		this.exception = exception;
	}
}

export type generation_result = {
	definitions: {
		keys: string[];
		supported: string[];
		missing_target_files: string[];
	};
	files: {[key: string]: ts.Node[]};
};

export class DocsTsGenerator {
	private readonly cache_path: string | undefined;
	private readonly docs_path: string | object[];
	private docs: object[] | undefined;

	constructor({
		docs_path, // raw JSON or path to UTF-16LE encoded Docs.json
		cache_path = undefined, // optional cache folder path for cacheable resources
	}: {
		docs_path: string | object[];
		cache_path?: string;
	}) {
		this.docs_path = docs_path;
		this.cache_path = cache_path;
	}

	private async load_from_file(filepath: string): Promise<any> {
		const file = await readFile(filepath, {
			encoding: 'utf-16le',
		});

		const utf8 = Buffer.from(file).toString('utf-8');

		return JSON.parse(utf8.trim());
	}

	private async load(): Promise<any> {
		if (undefined === this.docs) {
			if ('string' !== typeof this.docs_path) {
				return this.docs_path;
			} else if (!this.docs_path.endsWith('.json')) {
				throw new Error('Probably not a JSON file');
			} else {
				if (this.cache_path) {
					const utf8_filename = basename(this.docs_path).replace(
						/\.json$/,
						'.utf8.json'
					);
					const utf8_filepath = `${this.cache_path}/${utf8_filename}`;

					if (existsSync(utf8_filepath)) {
						this.docs = JSON.parse(
							(await readFile(utf8_filepath)).toString()
						);
					}

					const json = await this.load_from_file(this.docs_path);

					await writeFile(
						utf8_filepath,
						JSON.stringify(json, null, '\t') + '\n'
					);

					return json;
				} else {
					return await this.load_from_file(this.docs_path);
				}
			}
		}

		return this.docs;
	}

	private async validate<
		T extends [
			{
				NativeClass: string;
				Classes: {ClassName: string}[];
			},
			...{
				NativeClass: string;
				Classes: {ClassName: string}[];
			}[],
		],
	>(json: any, schema: {$id: 'update8.schema.json'}): Promise<T> {
		/* unfortunately this code doesn't work because it generates the wrong type of js :(
		if (this.cache_path) {
			const file_sha512 = createHash('sha512');

			file_sha512.update(await readFile(`${__dirname}/../schema/${schema['$id']}`));

			const filename = `${schema['$id']}.${file_sha512.digest('hex')}.mjs`;
			const filepath = `${this.cache_path}/${filename}`;

			if (!existsSync(filepath)) {
				console.log('precompiled validator not generated');
				default_config.ajv = new Ajv({
					verbose: true,
					code: {
						source: true,
						es5: false,
						esm: true,
						optimize: true,
					},
				});
				configure_ajv(default_config.ajv);

				await writeFile(
					filepath,
					await format_code(
						standalone(
							default_config.ajv,
							default_config.ajv.compile(schema)
						)
					)
				);
			}

			const validateDocs = await import(filepath);

			if (!validateDocs(json)) {
				throw new ValidationError(
					'Argument 1 failed to validate against the Update 8 JSON Schema',
					validateDocs.errors,
					json
				);
			}

			return json as T;
		}
		 */

		default_config.ajv = new Ajv({
			verbose: true,
		});

		const validateDocs = default_config.ajv.compile<T>(schema);

		if (!validateDocs(json)) {
			throw new ValidationError(
				'Argument 1 failed to validate against the Update 8 JSON Schema',
				validateDocs.errors,
				json
			);
		}

		return json;
	}

	async get() {
		return this.validate(
			await this.load(),
			update8_schema as typeof update8_schema & {
				$id: 'update8.schema.json';
			}
		);
	}

	/**
	 * @throws {GenerationException}
	 */
	async generate_types(
		parent_folder: string,
		throw_on_failure_to_find = true,
		write_on_failure = false
	): Promise<generation_result> {
		try {
			const progress = await this.actually_generate_types(
				throw_on_failure_to_find
			);

			await this.write_files(parent_folder, progress.files);

			return progress;
		} catch (err) {
			if (write_on_failure && err instanceof GenerationException) {
				await this.write_files(parent_folder, err.progress.files);
			}

			throw err;
		}
	}

	/**
	 * @throws {GenerationException}
	 */
	private async actually_generate_types(
		throw_on_failure_to_find = true
	): Promise<generation_result> {
		const target_files: {[key: string]: string} = Object.assign(
			{},
			enum_target_files,
			color_target_files,
			validator_target_files,
			vectors_target_files,
			constants_target_files,
			prefixes_target_files,
			arrays_target_files,
			classes_target_files,
			unions_target_files,
			aliases_target_files
		);

		const generators: (
			| TypesGenerationFromSchema<any>
			| TypesGenerationMatchesReferenceName<any, any>
		)[] = [
			...color_generators,
			...enum_generators,
			...validator_generators,
			...vectors_generators,
			...constants_generators,
			...prefixes_generators,
			...arrays_generators,
			...classes_generators,
			...unions_generators,
			...aliases_generators,
		];

		const type_node_generation = new TypeNodeGenerationMatcher([
			...enum_type_node_generators,
			...const_type_node_generators,
			...validators_type_node_generators,
			...vectors_type_node_generators,
			...color_type_node_generators,
			...arrays_type_node_generators,
			...type_node_generators,
			...prefixes_type_node_generators,
			...unions_type_node_generators,
			...aliases_type_node_generators,
		]);
		type_node_generation.throw_on_failure_to_find =
			throw_on_failure_to_find;

		const supported_conversions: GenerationMatch<object>[] =
			Object.entries(update8_schema.definitions)
				.filter((e: [string, object]) => {
					for (const generator of generators) {
						if (
							generator.test(
								generator instanceof TypesGenerationFromSchema
									? e[1]
									: e[0]
							)
						) {
							return true;
						}
					}

					return false;
				})
				.map((e: [string, object]) => {
					return new GenerationMatch<object>(
						e[0],
						e[1],
						generators.find((maybe) => {
							if (maybe instanceof TypesGenerationFromSchema) {
								return maybe.test(e[1]);
							}

							return maybe.test(e[0]);
						}) as
							| TypesGenerationFromSchema<object>
							| TypesGenerationMatchesReferenceName<object, any>
					);
				});

		const supported_conversion_names = supported_conversions.map(
			(e) => e.definition
		);

		for (const supported_elsewhere of [
			...Classes_supported_base_classes,
			...vectors_supported_meta_types,
		]) {
			if (!supported_conversion_names.includes(supported_elsewhere)) {
				supported_conversion_names.push(supported_elsewhere);
			}
		}

		let missing_target_files = supported_conversions
			.map((match) => {
				return match.definition;
			})
			.filter((maybe) => !(maybe in target_files));

		const definitions_keys = Object.keys(update8_schema.definitions);

		let progress: generation_result = {
			definitions: {
				keys: definitions_keys,
				supported: supported_conversion_names,
				missing_target_files: missing_target_files,
			},
			files: {},
		};

		function update_progress() {
			missing_target_files = supported_conversions
				.map((match) => {
					return match.definition;
				})
				.filter((maybe) => !(maybe in target_files));

			progress = {
				definitions: {
					keys: definitions_keys,
					supported: supported_conversion_names,
					missing_target_files: missing_target_files,
				},
				files: progress.files,
			};
		}

		const Update8 = new Update8TypeNodeGeneration(type_node_generation);

		for (const generator of [
			...validator_custom_generators,
			...Update8.generate_generators(default_config.ajv),
			...vectors_custom_generators,
		]) {
			try {
				const Classes_results: (
					| {file: string; node: ts.Node}
					| {file: string; node: ts.Node; ref: string}
				)[] = generator();

				for (const result of Classes_results) {
					const {file, node} = result;

					if ('ref' in result) {
						target_files[result.ref] = file;

						if (!supported_conversion_names.includes(result.ref)) {
							supported_conversion_names.push(result.ref);
						}
					}

					if (!(file in progress.files)) {
						progress.files[file] = [];
					}

					progress.files[file].push(node);
				}
			} catch (err) {
				update_progress();
				throw new GenerationException(progress, err);
			}
		}

		update_progress();

		for (const match of supported_conversions) {
			if (!(match.definition in target_files)) {
				if (
					is_ref(match.definition) &&
					Update8.can_guess_filename(match.definition)
				) {
					target_files[match.definition] = Update8.guess_filename(
						match.definition
					);
				} else {
					update_progress();
					throw new GenerationException(
						progress,
						new Error(
							`no target file found for ${match.definition}`
						)
					);
				}
			}

			const target_file = target_files[match.definition];

			if (!(target_file in progress.files)) {
				progress.files[target_file] = [];
			}

			progress.files[target_file].push(
				match.generation.generate(match.data, match.definition)
			);
		}

		update_progress();

		try {
			progress.files['Docs.json.ts'] = [
				Update8.generate_DocsJsonTs(default_config.ajv),
			];
		} catch (err) {
			update_progress();
			throw new GenerationException(progress, err);
		}

		update_progress();

		return progress;
	}

	private async write_files(
		parent_folder: string,
		files: {[key: string]: ts.Node[]}
	) {
		const auto_imports = new DocsTsAutoImports(files);
		await auto_imports.generate();

		const printer = ts.createPrinter({
			newLine: ts.NewLineKind.LineFeed,
		});

		const cleanup = await glob(`${parent_folder}/update8/**/*.ts`);

		for (const remove of cleanup) {
			await unlink(remove);
		}

		for (const entry of Object.entries(files)) {
			const result_file = ts.createSourceFile(
				entry[0],
				'',
				ts.ScriptTarget.Latest,
				false,
				ts.ScriptKind.TS
			);

			const classes = entry[1].filter(ts.isClassDeclaration);

			const classes_mapped = Object.fromEntries(
				classes.map((e) => [e.name?.escapedText + '', e])
			);

			type class_can_have_tree = ts.ClassDeclaration & {
				heritageClauses: [{types: [{expression: ts.Identifier}]}];
			};

			function can_class_have_tree(
				class_node: ts.ClassDeclaration
			): class_node is class_can_have_tree {
				const heritage = [...(class_node.heritageClauses || [])].map(
					(e) => e.types
				);

				return (
					1 === heritage.length &&
					1 === heritage[0].length &&
					ts.isExpressionWithTypeArguments(heritage[0][0]) &&
					ts.isIdentifier(heritage[0][0].expression)
				);
			}

			const class_can_have_trees = Object.fromEntries(
				classes
					.filter(can_class_have_tree)
					.map((e) => [e.name?.escapedText + '', e])
			);

			const class_parents = Object.values(class_can_have_trees).map(
				(class_node) => {
					let checking: undefined | ts.ClassDeclaration = class_node;

					const tree: string[] = [class_node.name?.escapedText + ''];

					while (
						checking &&
						can_class_have_tree(checking) &&
						checking.heritageClauses[0].types[0] &&
						checking.heritageClauses[0].types[0].expression.escapedText.toString() in
							class_can_have_trees
					) {
						const parent_class_name: string =
							checking.heritageClauses[0].types[0].expression.escapedText.toString();
						if (parent_class_name in classes_mapped) {
							tree.push(parent_class_name);

							checking = classes_mapped[parent_class_name];
						} else {
							checking = undefined;
						}
					}

					return tree;
				}
			);

			const class_parent_classes = class_parents
				.flat()
				.reduce((was, is) => {
					if (!was.includes(is)) {
						was.push(is);
					}

					return was;
				}, [] as string[]);
			const class_parent_class_max_depth = Object.fromEntries(
				class_parent_classes
					.map((thing): [string, string[][]] => {
						const includes = class_parents.filter((e) =>
							e.includes(thing)
						);

						return [thing, includes];
					})
					.filter(
						(
							entry
						): entry is [string, [string[], ...string[][]]] => {
							return entry[1].length > 0;
						}
					)
					.map((entry) => {
						return [
							entry[0],
							Math.max(
								0,
								...entry[1].map((e) => e.indexOf(entry[0]))
							),
						];
					})
			);

			const classes_in_order = class_parent_classes.sort((a, b) => {
				return (
					class_parent_class_max_depth[b] -
					class_parent_class_max_depth[a]
				);
			});

			const nodes = [
				...ImportTracker.generate_imports(entry[0]),
				...entry[1].sort((a, b) => {
					if (
						ts.isTypeAliasDeclaration(a) &&
						!ts.isTypeAliasDeclaration(b)
					) {
						return -1;
					}

					if (ts.isClassDeclaration(a) && ts.isClassDeclaration(b)) {
						return (
							classes_in_order.indexOf(
								a.name?.escapedText + ''
							) -
							classes_in_order.indexOf(b.name?.escapedText + '')
						);
					}

					return 0;
				}),
			];

			const file_name = `${parent_folder}/update8/${entry[0]}`;
			const dir = dirname(file_name);

			await mkdir(dir, {
				recursive: true,
			});

			await writeFile(
				file_name,
				await format_code(
					nodes
						.map((node) => {
							return printer.printNode(
								ts.EmitHint.Unspecified,
								node,
								result_file
							);
						})
						.join('\n\n')
				)
			);
		}
	}
}

const prettier_config = prettier.resolveConfig(`${__dirname}/../.prettierrc`);

export async function format_code(
	code: string,
	parser: BuiltInParserName = 'typescript'
): Promise<string> {
	const config = await prettier_config;

	if (!config) {
		throw new Error('could not find prettier config');
	}

	return prettier.format(
		code,
		Object.assign(
			{
				parser,
			},
			config
		)
	);
}
