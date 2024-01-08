// @ts-check

import { build } from 'esbuild';
import { replace } from 'esbuild-plugin-replace';
import pkg from '../package.json' with { type: 'json' };
import esbuildPkg from 'esbuild/package.json' with { type: 'json' };
import os from 'node:os';

const pv = (p, v) => `${p}@\x1b[41m${v}\x1b[0m`;
console.table([
	{ '': 'tmi.js', version: pkg.version },
	{ '': 'esbuild', version: esbuildPkg.version },
	{ '': 'node', version: process.versions.node },
	{ '': 'os', version: `${os.type()} ${os.release()}` },
]);

/**
 * @type {import('esbuild').BuildOptions}
 */
const options_shared = {
	bundle: true,
	minify: true,
	keepNames: true,
	sourcemap: true,
	sourcesContent: false,
	target: 'es2022',
	tsconfig: 'tsconfig.json',
	outdir: 'dist',
	plugins: [
		replace({
			include: /\.ts$/,
			values: {
				'process.env.npm_package_version': JSON.stringify(pkg.version),
			},
		})
	]
};
/**
 * @type {import('esbuild').BuildOptions}
 */
const options_sharedESM = {
	format: 'esm',
	outExtension: { '.js': '.mjs' },
};

const entryFile = 'src/index.ts';

/**
 * @type {Record<string, import('esbuild').BuildOptions>}
 */
const optionsList = {
	node_esm: {
		platform: 'node',
		entryPoints: { 'node': entryFile },
		packages: 'external',
		...options_sharedESM
	},
	node_cjs: {
		platform: 'node',
		entryPoints: { 'node': entryFile },
		outExtension: { '.js': '.cjs' },
		packages: 'external',
		format: 'cjs',
	},
	browser_esm: {
		platform: 'browser',
		entryPoints: { 'browser': entryFile },
		...options_sharedESM
	},
};

const args = process.argv.slice(2);
const optionsSelected = optionsList[args[0]];
if(!optionsSelected && args.length) {
	console.error('Valid options: ' + Object.keys(optionsList).join(', '));
	process.exit(1);
}
else if(optionsSelected) {
	makeBuild(args[0], optionsSelected).catch(handleBuildError);
}
else {
	console.time('Build all');
	await Promise.all(Object.entries(optionsList).map(([ name, options ]) =>
		makeBuild(name, options).catch(handleBuildError)
	));
	console.timeEnd('Build all');
}

async function makeBuild(name, options) {
	const logLine = `- ${name}`;
	console.time(logLine);
	await build({ ...options_shared, ...options });
	console.timeEnd(logLine);
}

function handleBuildError(err) {
	console.error(err);
	process.exit(1);
}