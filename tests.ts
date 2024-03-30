import {
	tap,
} from 'node:test/reporters';
import {
	run,
} from 'node:test';
import {
	glob,
} from 'glob';
import {
	__dirname_from_meta,
} from './lib/__dirname';

const __dirname = __dirname_from_meta(import.meta);

const ac = new AbortController();

run({
	files: await glob(`${__dirname}/tests/**/*.spec.ts`),
	concurrency: true,
	signal: ac.signal,
})
	.on('test:fail', (e) => {
		ac.abort();
		console.error(e);
		process.exitCode = 1;
	})
	.compose(tap)
	.pipe(process.stdout);
