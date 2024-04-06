export function object_has_property<
	Property extends string = string,
	Value = unknown
>(
	maybe: unknown,
	property: Property,
	predicate: undefined|((maybe:unknown) => maybe is Value) = undefined
): maybe is {[key: string]: unknown} & {[key in Property]: Value} {
	return (
		value_is_non_array_object(maybe)
		&& property in maybe
		&& (
			undefined === predicate
			|| predicate(maybe[property])
		)
	);
}

export function object_has_only_properties_that_match_predicate<
	Value = unknown
>(
	maybe: unknown,
	predicate:(object_value:unknown) => object_value is Value
): maybe is {[key: string]: Value} {
	return (
		value_is_non_array_object(maybe)
		&& Object.values(maybe).every(e => predicate(e))
	);
}

export function property_exists_on_object(
	object: {[key: string]: unknown},
	property: string,
) :  property is keyof object {
	return property in object;
}

export function object_has_non_empty_array_property<
	Property extends string = string,
	Value = unknown
>(
	maybe: unknown,
	property: Property,
	predicate:
		| undefined
		| ((inner_maybe: unknown) => inner_maybe is Value) = undefined
): maybe is (
	& {[key: string]: unknown}
	& {[key in Property]: [Value, ...Value[]]}
) {
	return (
		object_has_property(maybe, property)
		&& is_non_empty_array(maybe[property], predicate)
	);
}

export function object_has_property_that_equals(
	maybe: unknown,
	property: string,
	expects: unknown
): maybe is {[key: string]: unknown} & {
	[key in typeof property]: typeof expects;
} {
	return object_has_property(maybe, property) && expects === maybe[property];
}

export function value_is_non_array_object(
	maybe: unknown
): maybe is {[key: string]: unknown} {
	return 'object' === typeof maybe && !(maybe instanceof Array);
}

export function is_non_empty_array<T = unknown>(
	maybe: unknown,
	predicate:
		| undefined
		| ((inner_maybe: unknown) => inner_maybe is T) = undefined
): maybe is [T, ...T[]] {
	return (
		maybe instanceof Array
		&& maybe.length >= 1
		&& (undefined === predicate || maybe.every((e) => predicate(e)))
	);
}

export function object_only_has_that_property<T = unknown>(
	maybe: unknown,
	property: string,
	predicate: undefined | ((maybe: unknown) => maybe is T) = undefined
): maybe is {[key in typeof property]: T} {
	return (
		value_is_non_array_object(maybe)
		&& object_has_property(maybe, property)
		&& 1 === Object.keys(maybe).length
		&& (undefined === predicate || predicate(maybe[property]))
	);
}

export function annoyingly_have_to_escape_property(property: string): string {
	return property.replace(/([[\]])/g, '\\$1');
}

export abstract class SupportedSubSchemaType<
	ObjectType extends {[key: string]: unknown} = {[key: string]: unknown}
> {
	abstract is_supported_schema(maybe: unknown): maybe is ObjectType;

	abstract value_regex(value: ObjectType): string;
}
