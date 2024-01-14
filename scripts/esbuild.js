// @ts-check

import { build } from 'esbuild';
import { replace } from 'esbuild-plugin-replace';
import pkg from '../package.json' with { type: 'json' };
import esbuildPkg from 'esbuild/package.json' with { type: 'json' };
import os from 'node:os';

console.table([
	{ '': 'tmi.js', version: pkg.version },
	{ '': 'esbuild', version: esbuildPkg.version },
	{ '': 'node', version: process.versions.node },
	{ '': 'os', version: `${os.type()} ${os.release()}` },
]);

const entryFile = 'src/index.ts';

/**
 * @type {import('esbuild').BuildOptions}
 */
const optionsAll = {
	bundle: true,
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
const optionsEsm = {
	format: 'esm',
	outExtension: { '.js': '.mjs' },
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const optionsGlobal = {
	format: 'iife',
	globalName: 'tmi',
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const optionsNode = {
	platform: 'node',
	entryPoints: { 'tmi.node': entryFile },
	packages: 'external',
	minifySyntax: true,
	minifyIdentifiers: true,
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const optionsBrowser = {
	platform: 'browser',
};

/**
 * @type {Record<string, import('esbuild').BuildOptions>}
 */
const optionsList = {
	node_esm: {
		...optionsEsm,
		...optionsNode
	},
	node_cjs: {
		outExtension: { '.js': '.cjs' },
		format: 'cjs',
		...optionsNode
	},
	browser_esm: {
		entryPoints: { 'tmi.esm-browser': entryFile },
		...optionsBrowser,
		...optionsEsm
	},
	browser_esm_min: {
		entryPoints: { 'tmi.esm-browser.min': entryFile },
		minify: true,
		...optionsBrowser,
		...optionsEsm
	},
	browser_global: {
		entryPoints: { 'tmi.global-browser': entryFile },
		format: 'iife',
		...optionsBrowser,
		...optionsGlobal
	},
	browser_global_min: {
		entryPoints: { 'tmi.global-browser.min': entryFile },
		format: 'iife',
		minify: true,
		...optionsBrowser,
		...optionsGlobal
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
	await build({ ...optionsAll, ...options });
	console.timeEnd(logLine);
}

function handleBuildError(err) {
	console.error(err);
	process.exit(1);
}