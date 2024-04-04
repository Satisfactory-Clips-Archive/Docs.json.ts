import {
	TypeDefinitionWriter,
} from './lib/TypeDefinitionWriter';
import {
	NoMatchError,
} from './lib/Exceptions';
import {
	writeFile,
} from 'node:fs/promises';
import {
	__dirname_from_meta,
} from './lib/__dirname';
import {
	docs,
} from './lib/helpers';

const __dirname = __dirname_from_meta(import.meta);

try {
	const bar = new TypeDefinitionWriter(
		docs
	);
	await bar.write(`${__dirname}/generated-types/update8/`);
	const discovery = await bar.discovery;
	const result = await discovery.discover_type_definitions();

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
			JSON.stringify(err.property, null, '\t')
		);

		console.error(err.message, err.stack);
	} else {
		throw err;
	}
}
