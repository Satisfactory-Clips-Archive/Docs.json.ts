import {
	describe,
	it,
} from 'node:test';
import assert from 'node:assert/strict';
import {
	Generator,
} from '../../../lib/DataDiscovery/Generator';

void describe('Generator.find', () => {
	void it('resolves unmatched to raw', async () => {
		const foo = await (await Generator.find([], 'foo')).result();

		assert.equal(foo, 'foo');
	})
});