import type { IrcMessage } from './IrcMessage';
import { parseTagsFunc, parseTagsMap } from './tags';

/**
 * @see https://ircv3.net/specs/extensions/message-tags.html#escaping-values
 */
const ircEscapedChars = {
	'\\s': ' ',
	'\\n': '\n',
	'\\r': '\r',
	'\\:': ';',
	'\\\\': '\\',
} as const;
const ircUnescapedChars = {
	' ': 's',
	'\n': 'n',
	'\r': 'r',
	';': ':',
	'\\': '\\\\',
} as const;

export function unescapeIrc(value: string) {
	if (!value || !value.includes('\\')) {
		return value;
	}

	return value.replaceAll(/\\[:\\nrs]/g, (match) => ircEscapedChars[match[1] as keyof typeof ircEscapedChars]);
}

export function escapeIrc(value: number | string) {
	const stringValue = `${value}`;
	return stringValue.replaceAll(
		/[\s;\\]/g,
		(match) => '\\' + ircUnescapedChars[match as keyof typeof ircUnescapedChars] || match,
	);
}

export function parseIrcLine(line: string): IrcMessage | undefined {
	if (!line) {
		return;
	}

	let workingLine = line;

	const getNextSpace = () => workingLine.indexOf(' ');
	const getNextSpaceOrEnd = () => {
		const nextSpace = getNextSpace();
		return nextSpace === -1 ? workingLine.length : nextSpace;
	};

	const advanceToNextSpaceOrEnd = (spaceIndex = getNextSpaceOrEnd()) => {
		workingLine = workingLine.slice(spaceIndex + 1);
	};

	const firstCharIs = (char: string) => workingLine.startsWith(char);
	const raw = workingLine;
	const rawTags: IrcMessage['rawTags'] = {};
	const tags: IrcMessage['tags'] = {};
	let tagsRaw: string[] = [];
	if (firstCharIs('@')) {
		tagsRaw = workingLine.split(' ', 1)[0].slice(1).split(';');
		advanceToNextSpaceOrEnd();
	}

	const prefix: IrcMessage['prefix'] = { nick: undefined, user: undefined, host: undefined };
	if (firstCharIs(':')) {
		const nextSpace = getNextSpace();
		const prefixRaw = workingLine.slice(1, nextSpace);
		if (prefixRaw.includes('!')) {
			[prefix.nick, prefix.user] = prefixRaw.split('!');
			if (prefix.user.includes('@')) {
				[prefix.user, prefix.host] = prefix.user.split('@');
			}
		} else if (prefixRaw.includes('@')) {
			[prefix.nick, prefix.host] = prefixRaw.split('@');
		} else {
			prefix.host = prefixRaw;
		}

		advanceToNextSpaceOrEnd(nextSpace);
	}

	const command = workingLine.split(' ', 1)[0] as IrcMessage['command'];
	advanceToNextSpaceOrEnd();
	let channel: IrcMessage['channel'];
	if (firstCharIs('#')) {
		channel = workingLine.split(' ', 1)[0] as IrcMessage['channel'];
		advanceToNextSpaceOrEnd();
	}

	const params: string[] = [];
	while (workingLine.length) {
		if (firstCharIs(':')) {
			params.push(workingLine.slice(1));
			break;
		}

		const nextSpace = getNextSpace();
		params.push(workingLine.slice(0, nextSpace));
		advanceToNextSpaceOrEnd(nextSpace);
	}

	const unknownTagMap = new Map();
	const message: IrcMessage = { raw, prefix, command, channel, params, rawTags, tags };
	for (const tag of tagsRaw) {
		const [key, value] = tag.split('=');
		if (!parseTagsMap.has(key)) {
			console.warn('Unknown tag:', { key, value });
			unknownTagMap.set(key, value);
		}

		const unescapedValue = unescapeIrc(value);
		rawTags[key] = unescapedValue;
		const [name, parseFunc] = parseTagsMap.get(key) ?? [key, parseTagsFunc.string];
		tags[name] = parseFunc(unescapedValue, message);
	}

	if (unknownTagMap.size) {
		message.unknownTags = unknownTagMap;
	}

	return message;
}
