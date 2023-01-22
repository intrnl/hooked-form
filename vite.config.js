import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
	build: {
		sourcemap: true,
		minify: false,
		lib: {
			entry: './lib/index.ts',
			formats: ['esm', 'cjs'],
			fileName: 'hooked-form',
		},
		rollupOptions: {
			external: ['react', 'react/jsx-runtime'],
		},
	},
	plugins: [
		react(),
		dts(),
	],
});
