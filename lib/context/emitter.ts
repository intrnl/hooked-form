export type Force = () => void;

interface EmitMap {
	[fieldId: string]: Set<Force>;
}

export const createEmitter = () => {
	const mapping: EmitMap = { '*': new Set() };

	return {
		_on: (fieldId: string, cb: Force) => {
			(mapping[fieldId] || (mapping[fieldId] = new Set())).add(cb);

			return () => {
				mapping[fieldId].delete(cb);
			};
		},
		_emit: (fieldId: string | Array<string>) => {
			const visited: Set<string> = new Set();
			if (!Array.isArray(fieldId)) {
				fieldId = [fieldId];
			}

			fieldId.push('*');
			fieldId.map((f) => {
				if (!visited.has(f) && mapping[f]) {
					mapping[f].forEach((c) => {
						c();
					});
					visited.add(f);
				}
			});
		},
	};
};
