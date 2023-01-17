export const deriveInitial = (
	obj: { [fieldId: string]: any },
	defaultValue: any,
): { [fieldId: string]: any } => {
	const result: { [fieldId: string]: any } = {};

	for (const key in obj) {
		const value = obj[key];

		if (Array.isArray(value)) {
			result[key] = value.map((val: any) =>
				typeof val === 'object'
					? deriveInitial(val, defaultValue)
					: defaultValue
			);
		}
		else if (typeof value === 'object' && value) {
			result[key] = deriveInitial(value, defaultValue);
		}
		else {
			result[key] = defaultValue;
		}
	}

	return result;
};
