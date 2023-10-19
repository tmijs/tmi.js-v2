/**
 * The formatted channel name, including the leading #.
 */
export type ChannelString = `#${string}`;

export type TagsDataType = Record<string, any>;

export type ITags<TagsData extends TagsDataType> = {
	[Key in keyof TagsData]: TagsData[Key];
}

export type IrcCommands =
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
	TagsData extends TagsDataType | null = TagsDataType
> {
	raw: string;
	prefix: Record<'nick' | 'user' | 'host', string | undefined>;
	command: Command;
	channel?: ChannelString;
	params: string[];
	rawTags: Record<string, string>;
	tags: TagsData extends TagsDataType ? ITags<TagsData> : null;
	unknownTags?: Map<string, string>;
}