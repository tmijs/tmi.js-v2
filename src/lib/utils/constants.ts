export const ACTION_MESSAGE_PREFIX = '\u0001ACTION ';
export const ACTION_MESSAGE_SUFFIX = '\u0001';

/**
 * The tmi.js version that you are currently using.
 *
 * @privateRemarks This needs to explicitly be `string` so it is not typed as a "const string" that gets injected by esbuild.
 */
export const version = '[VI]{{version}}[/VI]' as string;
