import type { ChannelString } from './irc/IrcMessage';
import type { ROOMSTATE } from './irc/commands';

export class Channel {
	public name: string;

	public id?: string;

	public roomState?: ROOMSTATE.TagsData;

	public isJoined: boolean;

	public constructor(name: string) {
		this.name = Channel.normalizeName(name);
		this.isJoined = false;
	}

	/**
	 * Normalize a channel name. This will remove the leading # if present.
	 */
	public static normalizeName(name: Channel | ChannelString | string): string {
		if (name instanceof Channel) {
			return name.name;
		}

		if (typeof name !== 'string') {
			throw new TypeError('Invalid channel name');
		}

		const formattedName = name.trim().toLowerCase();
		if (!formattedName) {
			throw new Error('Invalid channel name');
		}

		if (formattedName.startsWith('#')) {
			return formattedName.slice(1);
		}

		return formattedName;
	}
}

export class ChannelTemporary extends Channel {
	public readonly isTemporary = true;

	public constructor(name: string, id?: string) {
		super(name);
		this.id = id;
	}
}
