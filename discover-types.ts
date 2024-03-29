import schema from './schema/update8.schema.json' assert {type: 'json'};
import Ajv from 'ajv/dist/2020';
import {
	TypeDefinitionWriter,
} from './lib/TypeDefinitionWriter';
import {
	DocsTsGenerator,
} from './lib/DocsTsGenerator';
import {
	NoMatchError,
} from './lib/DataTransformerDiscovery/NoMatchError';
import {
	writeFile,
} from 'node:fs/promises';

const __dirname = import.meta.dirname;

try {
	const bar = new TypeDefinitionWriter(
		new Ajv({
			verbose: true,
		}),
		schema
	);
	await bar.write(
		new DocsTsGenerator({
			docs_path: `${__dirname}/data/Docs.json`,
			cache_path: `${__dirname}/data/`,
		}),
		`${__dirname}/generated-types/update8/`,
	);
	const result = await bar.discovery.discover_type_definitions();

	process.stdout.write(
		`${
			JSON.stringify(result.missing_classes, null, '\t')
		}\n`
	);
	console.table({
		'Found Types': Object.keys(result.found_types).length,
		'Missing Types': result.missing_types.length,
		'Found Classes': result.found_classes.length,
		'Missing Classes': result.missing_classes.length,
	});
} catch (err) {
	if (err instanceof NoMatchError) {
		await writeFile(
			'./discovery-types.failure.json',
			JSON.stringify(err.value, null, '\t')
		);

		console.error(err.message, err.stack);
	} else {
		throw err;
	}
}
