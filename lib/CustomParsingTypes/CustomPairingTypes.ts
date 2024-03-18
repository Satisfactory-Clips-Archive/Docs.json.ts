import {
	LiteralExpression,
	LiteralTypeNode,
	TypeReferenceNode,
	UnionTypeNode,
} from 'typescript';

export function object_has_property<T extends string = string>(
	maybe: object,
	property: T
): maybe is {[key: string]: any} & {[key in T]: any} {
	return property in maybe;
}

export function object_has_non_empty_array_property<T extends string = string>(
	maybe: object,
	property: T
): maybe is {[key: string]: any} & {[key in T]: [any, ...any[]]} {
	return (
		object_has_property(maybe, property) &&
		value_is_array(maybe[property]) &&
		array_is_non_empty(maybe[property])
	);
}

export function object_has_property_that_equals(
	maybe: object,
	property: string,
	expects: any
): maybe is {[key: string]: any} & {[key in typeof property]: typeof expects} {
	return object_has_property(maybe, property) && expects === maybe[property];
}

export function value_is_array(maybe: object): maybe is any[] {
	return maybe instanceof Array;
}

export function value_is_non_array_object(
	maybe: any
): maybe is Exclude<object, any[]> {
	return 'object' === typeof maybe && !(maybe instanceof Array);
}

export function array_is_non_empty<T extends any = any>(
	maybe: T[]
): maybe is [T, ...T[]] {
	return maybe.length >= 1;
}

export function object_only_has_that_property<T extends string = string>(
	maybe: object,
	property: T
): maybe is {[key in T]: any} {
	return (
		object_has_property(maybe, property) && 1 === Object.keys(maybe).length
	);
}

export function annoyingly_have_to_escape_property(property: string): string {
	return property.replace(/([\[\]])/g, '\\$1');
}

export abstract class SupportedSubSchemaType<
	ObjectType extends {[key: string]: any},
	LiteralType extends LiteralExpression | UnionTypeNode | TypeReferenceNode,
> {
	abstract is_supported_schema(maybe: any): maybe is ObjectType;

	abstract value_regex(value: ObjectType): string;

	key_value_pair_regex(key: string, value: ObjectType): string {
		return `(?:${annoyingly_have_to_escape_property(key)}=(?:${this.value_regex(value)}))`;
	}

	abstract value_type(
		value: ObjectType
	): LiteralType extends LiteralExpression
		? LiteralTypeNode & {literal: LiteralType}
		: LiteralType;

	key_value_pair_literal_type_entry(
		key: string,
		value: ObjectType
	): [
		typeof key,
		LiteralType extends LiteralExpression
			? LiteralTypeNode & {literal: LiteralType}
			: LiteralType,
	] {
		return [key, this.value_type(value)];
	}
}
