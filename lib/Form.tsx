import * as React from 'react';
import { createEmitter } from './context/emitter';
import { deriveInitial } from './helpers/deriveInitial';
import { deriveKeys } from './helpers/deriveKeys';
import { get, set } from './helpers/operations';
import {
	ArrayHookContext,
	Errors,
	FormHookContext,
	Touched,
	ValidationTuple,
} from './types';

const EMPTY_OBJ = {};

export const formContext = React.createContext<FormHookContext>(
	EMPTY_OBJ as FormHookContext,
	// @ts-expect-error
	() => 0,
);

export interface SuccessBag {
	resetForm: () => void;
}

export interface ErrorBag {
	setErrors: (errors: Errors) => void;
	setFormError: (error: string) => void;
}

export interface CallBag {
	setErrors: (errors: Errors) => void;
	setFormError: (error: string) => void;
}

export interface Payload {
	change: (fieldId: string, value: any) => void;
	formError?: string | null;
	isDirty?: boolean | null;
	isSubmitting?: boolean | null;
	handleSubmit: (e?: React.SyntheticEvent) => void;
	resetForm: () => void;
}

export interface HookedFormProps<T> {
	children?: ((form: Payload) => React.ReactNode) | React.ReactNode;
	enableReinitialize?: boolean;
	initialErrors?: Errors;
	initialValues?: Partial<T>;
	onError?: (error: Error, callbag: ErrorBag) => void;
	onSuccess?: (result: any, callbag: SuccessBag) => void;
	onSubmit: (values: Partial<T>, callbag: CallBag) => Promise<any> | any;
	shouldSubmitWhenInvalid?: boolean;
	validate?: (values: Partial<T>) => object | undefined;
	validateOnBlur?: boolean;
	validateOnChange?: boolean;
}

const HookedForm = <Values extends object>({
	children,
	enableReinitialize,
	initialErrors,
	initialValues,
	onSubmit,
	validate,
	onError,
	onSuccess,
	shouldSubmitWhenInvalid,
	validateOnBlur,
	validateOnChange,
}: HookedFormProps<Values>) => {
	const fieldValidators = React.useRef<ValidationTuple[]>([]);
	const isDirty = React.useRef(false);
	const emitter = React.useMemo(createEmitter, []);

	const [values, setValues] = React.useState<Partial<Values> | object>(
		initialValues || EMPTY_OBJ,
	);

	const [touched, setTouched] = React.useState<
		Partial<Touched> | object
	>((initialErrors && (() => deriveInitial(initialErrors, true))) || EMPTY_OBJ);

	const [errors, setErrors] = React.useState<Partial<Errors> | object>(
		initialErrors || EMPTY_OBJ,
	);

	const t = React.useRef(touched);
	const e = React.useRef(errors);
	const v = React.useRef(values);

	const submittingState = React.useState(false);
	const formErrorState = React.useState<string | undefined>();

	const validateForm = () => {
		let validationErrors = (validate && validate(values)) || EMPTY_OBJ;

		fieldValidators.current.forEach((tuple) => {
			const error = tuple[1](get(values, tuple[0]));

			if (error) {
				validationErrors = set(validationErrors, tuple[0], error);
			}
		});

		// When we have fieldValidation we should remove the properties that return undefiend
		if (fieldValidators.current.length) {
			validationErrors = JSON.parse(JSON.stringify(validationErrors));
		}

		if (
			// Eager bailout for the EMPTY_OBJ case.
			validationErrors !== errors
			&& JSON.stringify(errors) !== JSON.stringify(validationErrors)
		) {
			setErrors(e.current = validationErrors as Errors);

			emitter._emit(
				([] as Array<string>).concat(
					deriveKeys(validationErrors),
					deriveKeys(errors),
				),
			);
		}

		return validationErrors;
	};

	const resetForm = () => {
		isDirty.current = false;
		setValues(v.current = initialValues || EMPTY_OBJ);

		if (initialErrors) {
			setTouched(t.current = deriveInitial(initialErrors, true));
			setErrors(e.current = initialErrors);
		}

		emitter._emit(
			([] as Array<string>).concat(
				deriveKeys(initialValues || EMPTY_OBJ),
				deriveKeys(values),
			),
		);
	};

	const handleSubmit = (event?: React.SyntheticEvent) => {
		if (event && event.preventDefault) {
			event.preventDefault();
		}

		submittingState[1](true);
		emitter._emit('s');

		const fieldErrors = validateForm();
		const derivedTouched = deriveInitial(fieldErrors, true);

		if (JSON.stringify(derivedTouched) !== JSON.stringify(touched)) {
			setTouched(t.current = deriveInitial(fieldErrors, true));

			emitter._emit(
				([] as Array<string>).concat(
					deriveKeys(derivedTouched),
					deriveKeys(touched),
				),
			);
		}

		if (!shouldSubmitWhenInvalid && deriveKeys(fieldErrors).length > 0) {
			submittingState[1](false);
			return emitter._emit('s');
		}

		const callbag = {
			setErrors: (submitErrors: Errors) => {
				setErrors(e.current = submitErrors);
			},
			setFormError: (err: string) => {
				formErrorState[1](err);
				emitter._emit('f');
			},
		};

		return new Promise((resolve) => resolve(onSubmit(values, callbag))).then(
			(result: any) => {
				submittingState[1](false);
				emitter._emit('s');

				if (onSuccess) {
					onSuccess(result, { resetForm });
				}
			},
			(err: Error) => {
				submittingState[1](false);
				emitter._emit('s');

				if (onError) {
					onError(err, callbag);
				}
			},
		);
	};

	React.useEffect(() => {
		if (enableReinitialize) {
			resetForm();
		}
	}, [initialValues]);

	React.useEffect(() => {
		if (
			(validateOnBlur === undefined || validateOnChange || validateOnBlur)
			&& isDirty.current
		) {
			validateForm();
		}
	}, [
		validateOnBlur === undefined ? touched : validateOnBlur && touched,
		validateOnChange && values,
	]);

	const change = (fieldId: string, value: any) => {
		isDirty.current = true;
		setValues((state) => (v.current = set(state, fieldId, value)));
		emitter._emit(fieldId);
	};

	return (
		<formContext.Provider
			value={{
				errors: errors as Errors,
				formError: formErrorState[0],
				isDirty: isDirty.current,
				isSubmitting: submittingState[0],
				resetForm,
				setFieldError: (fieldId: string, error?: string) => {
					setErrors(
						(state) => (e.current = set(state as object, fieldId, error)),
					);
					emitter._emit(fieldId);
				},
				setFieldTouched: (fieldId: string, value: boolean) => {
					setTouched(
						(state) => (t.current = set(state as object, fieldId, value)),
					);
					emitter._emit(fieldId);
				},
				setFieldValue: change,
				submit: handleSubmit,
				touched: touched as Touched,
				validate: validateForm,
				values,
				_fieldValidators: fieldValidators.current,
				_on: emitter._on,
				_getTouched: () => t,
				_getErrors: () => e,
				_getValues: () => v,
			} as ArrayHookContext}
		>
			{typeof children === 'function'
				? children({
					change,
					formError: formErrorState[0],
					isDirty: isDirty.current,
					isSubmitting: submittingState[0],
					handleSubmit,
					resetForm,
				})
				: children}
		</formContext.Provider>
	);
};

export default HookedForm;
