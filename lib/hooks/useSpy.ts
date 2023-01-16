import * as React from 'react';
import { get } from '../helpers/operations';
import { FormHookContext } from '../types';
import { useContextEmitter } from './useContextEmitter';

export interface UseFieldSpyReturn<T> {
	error: string;
	touched: boolean;
	value: T;
}

export type SpyCallback<T> = (newValue: T, ctx: FormHookContext) => void;

const useSpy = <T = any>(
	fieldId: string,
	cb?: SpyCallback<T>,
): UseFieldSpyReturn<T> => {
	const isMounted = React.useRef<boolean>(false);
	const ctx = useContextEmitter(fieldId);
	const value = get(ctx.values, fieldId);

	React.useEffect(() => {
		if (isMounted.current && cb) {
			cb(value, ctx);
		}
		isMounted.current = true;
	}, [value]);

	return {
		error: get(ctx.errors, fieldId),
		touched: get(ctx.touched, fieldId),
		value,
	};
};

export default useSpy;
