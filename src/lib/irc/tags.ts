import type { IrcMessage } from './IrcMessage';
import { _parseTagsMapData, type ETagFuncName } from './tags-data';

export type TagFunc = (badge: string, message: IrcMessage<any>) => any;

export type EmoteIndices = [start: number, end: number][];
export type EmotesTag = Map<string, EmoteIndices>;

export interface MessageFlag {
	/**
	 * Flags:
	 * - `A`: Aggressive Content
	 * - `I`: Identity-Based Hate
	 * - `P`: Profane Content
	 * - `S`: Sexual Content
	 */
	flags: Record<'A' | 'I' | 'P' | 'S', number>;
	index: [start: number, end: number];
	text: string;
}

export const parseTagsFunc: Record<ETagFuncName, TagFunc> = {
	string: (val: string) => val,
	number: Number,
	literalBoolean: (val: string) => val === 'true',
	booleanNumber: (val: string) => val === '1',
	badges(badge: string) {
		const badges = new Map<string, string>();
		if (!badge) {
			return badges;
		}

		for (const b of badge.split(',')) {
			const [name, version] = b.split('/');
			badges.set(name, version);
		}

		return badges;
	},
	emotes(val: string) {
		const emotes: EmotesTag = new Map();
		if (!val) {
			return emotes;
		}

		for (const emote of val.split('/')) {
			const [id, indices] = emote.split(':');
			const finalIndices = indices.split(',').map((pos) => {
				const [start, end] = pos.split('-');
				return [Number(start), Number(end) + 1];
			});
			emotes.set(id, finalIndices as [number, number][]);
		}

		return emotes;
	},
	followersOnly: Number,
	// 	// return { '-1': false, '0': true }[val] ?? Number(val);
	// 	return Number(val);
	// },
	slow: Number,
	// 	// return { '0': false }[val] ?? Number(val);
	// 	return Number(val);
	// },
	flags(val: string, message: IrcMessage<any>): MessageFlag[] {
		const flags: MessageFlag[] = [];
		if (!val) {
			return flags;
		}

		const messageSplit = [...message.params[0]];
		for (const flag of val.split(',')) {
			const [indices, flagType] = flag.split(':');
			const [start, end] = indices.split('-');
			const index: [number, number] = [Number(start), Number(end) + 1];
			const flagTypeSplit = flagType.split('/') as unknown as [keyof MessageFlag['flags'], '.', string][];
			flags.push({
				index,
				flags: flagTypeSplit.reduce<MessageFlag['flags']>(
					(parts, [type, , level]) => {
						parts[type] = Number(level);
						return parts;
					},
					// eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
					{} as MessageFlag['flags'],
				),
				text: messageSplit.slice(...index).join(''),
			});
		}

		return flags;
	},
	threadId(val: string) {
		return val.split('_');
	},
	commaSeparatedStrings(val: string) {
		return val.split(',');
	},
};

export const parseTagsMap = new Map<string, [string, TagFunc]>(
	Object.entries(_parseTagsMapData).map(([key, [name, type]]) => [key, [name, parseTagsFunc[type]]]),
);
