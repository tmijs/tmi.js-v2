/**
 * The formatted channel name, including the leading #.
 */
export type ChannelString = `#${string}`;

export type TagsDataType = Record<string, any>;

export type ITags<TagsData extends TagsDataType> = {
	[Key in keyof TagsData]: TagsData[Key];
};

export type IrcCommands =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| '001'
	| '002'
	| '003'
	| '004'
	| '353'
	| '366'
	| '372'
	| '375'
	| '376'
	| '421'
	| 'CAP'
	| 'GLOBALUSERSTATE'
	| 'PING'
	| 'PONG'
	| 'JOIN'
	| 'PART'
	| 'PRIVMSG'
	| 'NOTICE'
	| 'USERSTATE'
	| 'ROOMSTATE'
	| 'CLEARCHAT'
	| 'CLEARMSG'
	| 'RECONNECT'
	// | 'HOSTTARGET'
	| 'USERNOTICE'
	| 'WHISPER';

export interface IrcMessage<
	Command extends IrcCommands = IrcCommands,
	TagsData extends TagsDataType | null = TagsDataType,
> {
	channel?: ChannelString;
	command: Command;
	params: string[];
	prefix: Record<'host' | 'nick' | 'user', string | undefined>;
	raw: string;
	rawTags: Record<string, string>;
	tags: TagsData extends TagsDataType ? ITags<TagsData> : null;
	unknownTags?: Map<string, string>;
}
