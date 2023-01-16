import { useEffect } from 'react';
import { get } from '../helpers/operations';
import {
	PrivateFormHookContext,
	ValidationTuple,
} from '../types';
import { useContextEmitter } from './useContextEmitter';

export interface UseFieldReturn<T> {
	error: string;
	touched: boolean;
	value: T;
	onBlur: () => void;
	onChange: (value: T) => void;
	onFocus: () => void;
}

export interface UseFieldProps<T> {
	format?: (value: T, fieldId: string) => any;
	parse?: (value: any, fieldId: string) => T;
	validate?: (value: T) => string | boolean | undefined;
}

const useField = <T = any>(
	fieldId: string,
	props: UseFieldProps<T> = {},
): UseFieldReturn<T> => {
	if (
		process.env.NODE_ENV !== 'production'
		&& (!fieldId || typeof fieldId !== 'string')
	) {
		throw new Error(
			'The Field needs a valid "fieldId" property to function correctly.',
		);
	}

	const { format, parse, validate } = props;

	const ctx = useContextEmitter(fieldId) as PrivateFormHookContext;

	const value = get(ctx.values, fieldId);
	const formatted = format ? format(value, fieldId) : value === undefined ? '' : value;

	useEffect(() => {
		if (validate) {
			const tuple: ValidationTuple = [fieldId, validate as (v: any) => string];
			ctx._fieldValidators.push(tuple);

			return () => {
				ctx._fieldValidators.splice(ctx._fieldValidators.indexOf(tuple), 1);
			};
		}

		return;
	}, [fieldId]);

	return {
		error: get(ctx.errors, fieldId),
		touched: get(ctx.touched, fieldId),
		value: formatted,
		onChange: (next: any) => {
			if (next && next.target) {
				next = next.target.value;
			}

			const parsed = parse ? parse(next, fieldId) : next;
			ctx.setFieldValue(fieldId, parsed);
		},
		onFocus: () => ctx.setFieldTouched(fieldId, false),
		onBlur: () => ctx.setFieldTouched(fieldId, true),
	};
};

export default useField;
