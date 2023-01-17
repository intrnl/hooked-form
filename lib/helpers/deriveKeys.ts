export const deriveKeys = (
	obj: { [key: string]: any },
	parentKey: string = '',
	accu: string[] = [],
): string[] => {
	for (const key in obj) {
		const value = obj[key];

		accu.push(parentKey + key);

		if (Array.isArray(value)) {
			for (let idx = 0, len = value.length; idx < len; idx++) {
				const val = value[idx];

				if (typeof val === 'object' && val) {
					deriveKeys(val, `${parentKey}${key}[${idx}].`, accu);
				}
				else {
					accu.push(`${parentKey}${key}[${idx}]`);
				}
			}
		}
		else if (typeof value === 'object' && value) {
			deriveKeys(value, `${parentKey}${key}.`, accu);
		}
	}

	return accu;
};
