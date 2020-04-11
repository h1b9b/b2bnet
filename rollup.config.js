import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import json from 'rollup-plugin-json';
import { terser } from "rollup-plugin-terser";


import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		input: 'src/b2bnet.ts',
		external: ['bs58', 'bs58check-ts', 'tweetnacl', 'ripemd160', 'debug', 'bencode', 'webtorrent'],
		output: {
			name: 'b2bnet',
			file: pkg.browser,
			format: 'umd',
			sourcemap: true,
			globals: {
				bs58:'bs58',
				'bs58check-ts': 'bs58check',
				tweetnacl:'nacl',
				ripemd160: 'ripemd160',
				debug: 'debug',
				bencode: 'bencode',
				webtorrent: 'webtorrent'
			}
		},
		plugins: [
			globals(),
			builtins(),
			json(),
			resolve({ preferBuiltins: true }),
			commonjs(),
			typescript(),
			terser()
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// an array for the `output` option, where we can specify 
	// `file` and `format` for each target)
	{
		input: 'src/b2bnet.ts',
		external: ['events', 'bs58', 'bs58check-ts', 'tweetnacl', 'ripemd160', 'debug', 'bencode', 'webtorrent'],
		plugins: [
			typescript({
				rollupCommonJSResolveHack: false,
				clean: true,
			}), // so Rollup can convert TypeScript to JavaScript
			terser()
		],
		output: [
			{ file: pkg.main, format: 'cjs', sourcemap: true },
			{ file: pkg.module, format: 'es', sourcemap: true }
		]
	}
];
