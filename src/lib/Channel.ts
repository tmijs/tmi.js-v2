import { ChannelString } from './irc/IrcMessage';
import { ROOMSTATE } from './irc/commands';

export class Channel {
	name: string;
	id?: string;
	roomState?: ROOMSTATE.TagsData;
	isJoined: boolean;
	constructor(name: string) {
		this.name = Channel.normalizeName(name);
		this.isJoined = false;
	}
	/**
	 * Normalize a channel name. This will remove the leading # if present.
	 */
	static normalizeName(name: string | ChannelString | Channel): string {
		if(name instanceof Channel) {
			return name.name;
		}
		if(typeof name !== 'string') {
			throw new Error('Invalid channel name');
		}
		name = name.trim().toLowerCase();
		if(!name) {
			throw new Error('Invalid channel name');
		}
		if(name.startsWith('#')) {
			return name.slice(1);
		}
		return name;
	}
}

export class ChannelTemporary extends Channel {
	isTemporary: true = true;
}