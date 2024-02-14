import os from 'node:os';
import process from 'node:process';
import type { BuildOptions } from 'esbuild';
import { build } from 'esbuild';
import esbuildPkg from 'esbuild/package.json' with { type: 'json' };
import { esbuildPluginVersionInjector } from 'esbuild-plugin-version-injector';
import pkg from '../package.json' with { type: 'json' };

console.table([
	{ '': 'tmi.js', version: pkg.version },
	{ '': 'esbuild', version: esbuildPkg.version },
	{ '': 'node', version: process.versions.node },
	{ '': 'os', version: `${os.type()} ${os.release()}` },
]);

const entryFile = 'src/index.ts';

const optionsAll = {
	bundle: true,
	sourcemap: true,
	sourcesContent: false,
	target: 'es2022',
	tsconfig: 'tsconfig.json',
	outdir: 'dist',
	plugins: [esbuildPluginVersionInjector()],
} as const satisfies BuildOptions;

const optionsEsm = {
	format: 'esm',
	outExtension: { '.js': '.mjs' },
} as const satisfies BuildOptions;

const optionsGlobal = {
	format: 'iife',
	globalName: 'tmi',
} as const satisfies BuildOptions;

const optionsNode = {
	platform: 'node',
	entryPoints: { 'tmi.node': entryFile },
	packages: 'external',
	minifySyntax: true,
	minifyIdentifiers: true,
} as const satisfies BuildOptions;

const optionsBrowser = {
	platform: 'browser',
} as const satisfies BuildOptions;

const optionsList = {
	node_esm: {
		...optionsEsm,
		...optionsNode,
	},
	node_cjs: {
		outExtension: { '.js': '.cjs' },
		format: 'cjs',
		...optionsNode,
	},
	browser_esm: {
		entryPoints: { 'tmi.esm-browser': entryFile },
		...optionsBrowser,
		...optionsEsm,
	},
	browser_esm_min: {
		entryPoints: { 'tmi.esm-browser.min': entryFile },
		minify: true,
		...optionsBrowser,
		...optionsEsm,
	},
	browser_global: {
		entryPoints: { 'tmi.global-browser': entryFile },
		...optionsBrowser,
		...optionsGlobal,
	},
	browser_global_min: {
		entryPoints: { 'tmi.global-browser.min': entryFile },
		minify: true,
		...optionsBrowser,
		...optionsGlobal,
	},
} as const satisfies Record<string, BuildOptions>;

const args = process.argv.slice(2);
const optionsSelected = optionsList[args[0] as keyof typeof optionsList] as BuildOptions | undefined;
if (!optionsSelected && args.length) {
	console.error('Valid options: ' + Object.keys(optionsList).join(', '));
	process.exit(1);
} else if (optionsSelected) {
	await makeBuild(args[0], optionsSelected).catch(handleBuildError);
} else {
	console.time('Build all');
	await Promise.all(
		Object.entries(optionsList).map(async ([name, options]) => makeBuild(name, options).catch(handleBuildError)),
	);
	console.timeEnd('Build all');
}

async function makeBuild(name: string, options: BuildOptions) {
	const logLine = `- ${name}`;
	console.time(logLine);
	await build({ ...optionsAll, ...options });
	console.timeEnd(logLine);
}

function handleBuildError(err: unknown) {
	console.error(err);
	process.exit(1);
}
