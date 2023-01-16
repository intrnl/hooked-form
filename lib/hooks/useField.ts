import { useEffect } from 'react';
import { get } from '../helpers/operations';
import {
	PrivateFormHookContext,
	ValidationTuple,
} from '../types';
import { useContextEmitter } from './useContextEmitter';

export interface FieldReturn<T> {
	error: string;
	touched: boolean;
	value: T;
	onBlur: () => void;
	onChange: (value: T) => void;
	onFocus: () => void;
}

const useField = <T = any>(
	fieldId: string,
	validate?: (value: T) => string | undefined,
): FieldReturn<T> => {
	if (
		process.env.NODE_ENV !== 'production'
		&& (!fieldId || typeof fieldId !== 'string')
	) {
		throw new Error(
			'The Field needs a valid "fieldId" property to function correctly.',
		);
	}

	const ctx = useContextEmitter(fieldId) as PrivateFormHookContext;

	useEffect(() => {
		const tuple: ValidationTuple = [fieldId, validate as (v: any) => string];
		if (validate) {
			ctx._fieldValidators.push(tuple);
		}
		return () => {
			if (validate) {
				ctx._fieldValidators.splice(ctx._fieldValidators.indexOf(tuple), 1);
			}
		};
	}, [fieldId]);

	return {
		error: get(ctx.errors, fieldId),
		touched: get(ctx.touched, fieldId),
		value: get(ctx.values, fieldId) || '',
		onBlur: () => {
			ctx.setFieldTouched(fieldId, true);
		},
		onChange: (value: T) => {
			ctx.setFieldValue(fieldId, value);
		},
		onFocus: () => {
			ctx.setFieldTouched(fieldId, false);
		},
	};
};

export default useField;
