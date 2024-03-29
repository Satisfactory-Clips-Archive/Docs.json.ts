import {
	TypeDefinitionDiscovery,
} from '../TypeDefinitionDiscovery';

type progress_group = {
	members: string[];
	subgroups: {[key: string]: progress_group};
};

function remap(group: progress_group) {
	const subgroups = Object.keys(group.subgroups);

	const retain: string[] = [];

	const remap_items: {[key: string]: string[]} = {};

	for (const item of group.members) {
		let retain_item = true;

		for (const subgroup of subgroups) {
			if (item.startsWith(subgroup)) {
				if (!(subgroup in remap_items)) {
					remap_items[subgroup] = [];
				}
				remap_items[subgroup].push(item);
				retain_item = false;
				break;
			}
		}

		if (retain_item) {
			retain.push(item);
		}
	}

	group.members = retain;

	for (const entry of Object.entries(remap_items)) {
		const [subgroup, items] = entry;

		group.subgroups[subgroup].members = [
			...items,
			...group.subgroups[subgroup].members,
		];
	}

	for (const subgroup of Object.values(group.subgroups)) {
		remap(subgroup);
	}
}

function reduce(
	group: progress_group,
	title: string = 'Basic Types',
	current_depth: number = 1
): {
	title: string;
	members: string[];
	depth: number;
}[] {
	return [
		{
			title,
			depth: 1 === current_depth ? 2 : current_depth,
			members: group.members,
		},
		...Object.entries(group.subgroups)
			.map((subgroup) => {
				return reduce(subgroup[1], subgroup[0], current_depth + 1);
			})
			.reduce((was, is) => {
				was.push(...is);

				return was;
			}, [])
			.sort((a, b) => {
				return a.title.localeCompare(b.title);
			}),
	];
}

function remove_indentation(input: string): string {
	const str = input.replace(/^\n+/, '').replace(/\n+\t*$/, '\n');

	const matches = /^(\t+)/gm.exec(str);

	if (matches) {
		const min = matches.reduce(
			(was, is) => Math.min(was, is.length),
			Infinity
		);

		if (min > 0 && min !== Infinity) {
			return str.replace(new RegExp(`^\t{${min}}`, 'gm'), '');
		}
	}

	return str;
}

export async function generate_markdown(
	discovery:TypeDefinitionDiscovery
): Promise<string> {

	const grouped_progress: progress_group = {
		members: [],
		subgroups: {},
	};

	const manual_groups = {
		class: '',
		'class--no-description': '',
		'class--no-description-or-display-name': '',
		'color-decimal--semi-native': 'color',
		'decimal-string': '',
		'decimal-string--signed': '',
		'integer-string': '',
		'integer-string--signed': '',
		'FGAmmoTypeInstantHit--base': 'FGAmmoType',
		'FGAmmoTypeInstantHit--chaos': 'FGAmmoType',
		'FGAmmoTypeInstantHit--standard': 'FGAmmoType',
		FGAmmoTypeProjectile: 'FGAmmoType',
		'FGAmmoTypeProjectile--base': 'FGAmmoType',
		xyz: 'vectors',
		'xyz--semi-native': 'vectors',
		xy: 'vectors',
		'xy--integer': 'vectors',
		'xy--semi-native': 'vectors',
		'xyz--integer': 'vectors',
		quaternion: 'vectors',
		'quaternion--semi-native': 'vectors',
		'pitch-yaw-roll': 'vectors',
		'FGEquipmentDescriptor--base': 'FGEquipment',
	};

	const discovered_types = await discovery.types_discovery.discover_types();

	const all_referenced_types = [
		...discovered_types.discovered_types,
		...discovered_types.missed_types,
	].map(e => e.substring(14)).sort((a, b) => a.localeCompare(b));
	const supported_types = discovered_types.discovered_types.map(
		e => e.substring(14)
	);

	for (const item of all_referenced_types) {
		const parts = item.split('--');

		let checking = grouped_progress;

		if (item in manual_groups) {
			if ('' !== manual_groups[item as keyof typeof manual_groups]) {
				if (
					!(
						manual_groups[item as keyof typeof manual_groups] in
						checking.subgroups
					)
				) {
					checking.subgroups[
						manual_groups[item as keyof typeof manual_groups]
					] = {
						members: [],
						subgroups: {},
					};
				}

				checking = checking.subgroups[
					manual_groups[item as keyof typeof manual_groups]
				];
			}
		} else if (parts.length > 1) {
			for (
				let iteration = 1;
				iteration < Math.min(2, parts.length);
				++iteration
			) {
				if (!(parts[iteration - 1] in checking.subgroups)) {
					checking.subgroups[parts[iteration - 1]] = {
						members: [],
						subgroups: {},
					};
				}

				checking = checking.subgroups[parts[iteration - 1]];
			}
		}

		if (!checking.members.includes(item)) {
			checking.members.push(item);
		}
	}

	remap(grouped_progress);

	return remove_indentation(`
		# Types Progress

		${(
			(supported_types.length /
				all_referenced_types.length) *
			100
		).toFixed(2)}% Complete (${supported_types.length} of ${
			all_referenced_types.length
		})

		${reduce(grouped_progress).map((group) => {
			return remove_indentation(
				`
					${'#'.repeat(group.depth)} ${group.title}

					${group.members.map((key) => {
					return `-   [${supported_types.includes(key) ? 'x' : ' '}] ${key.replace(
						/__/g,
						'\\_\\_'
					)}`;
				}).join('\n')}`);
		}).join('\n\n')}
	`);
}
