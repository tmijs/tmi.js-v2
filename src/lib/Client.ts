import WebSocket from 'isomorphic-ws';
import EventEmitter from 'eventemitter3';
import { Token } from './Token';
import { escapeIrc, parseIrcLine } from './irc/parser';
import type { IrcCommands, IrcMessage } from './irc/IrcMessage';
import type {
	GLOBALUSERSTATE, USERSTATE, JOIN, PART, ROOMSTATE, NOTICE, PRIVMSG,
	CLEARMSG, CLEARCHAT, USERNOTICE,
	ChatColor,
} from './irc/commands';
import { Channel, ChannelTemporary } from './Channel';
import { LogLevel, Logger } from './Logger';

const ACTION_MESSAGE_PREFIX = '\u0001ACTION ';
const ACTION_MESSAGE_SUFFIX = '\u0001';

const exponentLookup = [ 1, 10, 100, 1_000, 10_000, 100_000 ];

interface ClientOptions {
	log?: Logger;
	token?: ConstructorParameters<typeof Token>[0] | Token;
	initialChannels?: string[];
	wsOptions?: WebSocket.ClientOptions;
}

type ClientEvents = {
	socketOpen: [];
	socketClose: [ code: number, reason: string, wasClean: boolean ];
	socketError: [ event: WebSocket.ErrorEvent ];
	socketMessage: [ event: WebSocket.MessageEvent, lines: string[] ];

	identity: [ identity: Identity ];
	pong: [ latencyRoundTripMs: number ];
	unhandledCommand: [ message: IrcMessage ];
	ignoredCommand: [ message: IrcMessage ];

	ircMessage: [ message: IrcMessage ];

	GLOBALUSERSTATE: [ message: GLOBALUSERSTATE.Message ];
	USERSTATE: [ message: USERSTATE.Message ];
	ROOMSTATE: [ message: ROOMSTATE.Message ];
	JOIN: [ message: JOIN.Message ];
	PART: [ message: PART.Message ];
	NOTICE: [ message: NOTICE.Message ];
	USERNOTICE: [ message: USERNOTICE.Message ];
	PRIVMSG: [ message: PRIVMSG.Message ];
	CLEARMSG: [ message: CLEARMSG.Message ];
	CLEARCHAT: [ message: CLEARCHAT.Message ];

	ban: [ event: CLEARCHAT.Event_Ban ];
	timeout: [ event: CLEARCHAT.Event_Timeout ];
	chatCleared: [ event: CLEARCHAT.Event_ChatCleared ];
	deleteMessage: [ event: CLEARMSG.Event ];

	join: [ event: JOIN.Event ];

	part: [ event: PART.Event ];
	roomState: [ event: ROOMSTATE.Event ];

	message: [ event: PRIVMSG.Event ];

	sub: [ event: USERNOTICE.MsgId_Sub.Event ];
	resub: [ event: USERNOTICE.MsgId_Resub.Event ];
	submysterygift: [ event: USERNOTICE.MsgId_SubMysteryGift.Event ];
	subgift: [ event: USERNOTICE.MsgId_SubGift.Event ];
	communitypayforward: [ event: USERNOTICE.MsgId_CommunityPayForward.Event ];
	announcement: [ event: USERNOTICE.MsgId_Announcement.Event ];
};

interface Keepalive {
	/**
	 * The interval in milliseconds to send a ping to the server.
	 */
	intervalMs: number;
	/**
	 * The timeout in milliseconds to wait for a pong response from the server.
	 */
	timeoutMs: number;
	/**
	 * The interval timer.
	 */
	interval?: ReturnType<typeof setInterval>;
	/**
	 * The timeout timer.
	 */
	timeout?: ReturnType<typeof setTimeout>;
	/**
	 * The last timestamp a ping was sent to the server.
	 */
	lastPingOut?: number;
	/**
	 * The last latency measurement in milliseconds. This is a round-trip time.
	 */
	lastLatencyMs?: number;
}

interface Identity {
	/**
	 * The IRC nickname of the user.
	 */
	nick?: string;
	/**
	 * The user ID of the user.
	 */
	userId?: string;
	/**
	 * Whether the user is anonymous.
	 */
	isAnonymous?: boolean;
	/**
	 * The color of the user's name.
	 */
	color: ChatColor;
	token?: Token;
}

interface WaitForIrcCommandOptions<T, Message> {
	command: T;
	filterCallback: (message: Message) => boolean;
	badNotices?: string[];
	timeoutMs?: number;
}
interface WaitForIrcCommandByChannelOptions<T, Message> {
	command: T;
	channelName: string | Channel;
	filterCallback?: (message: Message) => boolean;
	badNotices?: string[];
	timeoutMs?: number;
}

interface SayReturnValue {
	channel: Channel | ChannelTemporary;
	tags: USERSTATE.TagsData;
	user: Identity;
}

export class Client extends EventEmitter<ClientEvents> {
	socket?: WebSocket;
	private opts: ClientOptions;
	private keepalive: Keepalive;
	log?: Logger;
	identity: Identity;
	/**
	 * The channels that the client is currently JOINed to.
	 */
	channels: Map<string, Channel>;
	private pendingChannels: Set<string> = new Set();
	constructor(opts?: ClientOptions) {
		super();
		this.opts = opts ?? {};
		this.log = this.opts.log ?? new Logger(LogLevel.Fatal);
		this.keepalive = {
			intervalMs: 60_000,
			timeoutMs: 10_000
		};
		this.identity = {
			get isAnonymous() {
				return this.token?.isAnonymous ?? true;
			},
			color: '',
			token: this.opts.token instanceof Token ? this.opts.token : new Token(this.opts.token)
		};
		this.channels = new Map();
		const initialChannels = (this.opts.initialChannels ?? []).map(Channel.normalizeName);
		this.pendingChannels = new Set(initialChannels);
	}

	async connect(): Promise<void> {
		if(this.socket) {
			const { readyState } = this.socket;
			if(readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) {
				// TODO: Ignore if already connecting or connected?
				throw new Error('Already connected or connecting');
			}
		}
		const connectionOptions: ClientOptions['wsOptions'] = { ...(this.opts.wsOptions ?? {}) };
		this.socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443', 'irc', connectionOptions);
		this.socket.onopen = this.onSocketOpen;
		this.socket.onclose = this.onSocketClose;
		this.socket.onerror = this.onSocketError;
		this.socket.onmessage = this.onSocketMessage;
	}
	disconnect(): void {
		this.socket?.close();
	}

	private async getIrcToken(): Promise<string> {
		const { token } = this.identity;
		if(token) {
			await token.getToken();
		}
		return token?.formatIrc() ?? Token.anonymousIrcToken;
		// return Token.anonymousToken;
	}

	private queuedEmit<T extends keyof ClientEvents>(event: T, ...args: ClientEvents[T]): void {
		setImmediate(() => this.emit(event, ...(args as any)));
	}

	private onSocketOpen: (() => Promise<void>) = async () => {
		this.log?.info('Socket open');
		this.startKeepalive();
		this.emit('socketOpen');
		this.send('CAP REQ :twitch.tv/commands twitch.tv/tags');
		const token = await this.getIrcToken();
		// this.identity.isAnonymous = token === Token.anonymousIrcToken;
		this.send(`PASS ${token}`);
		this.send(`NICK ${this.identity.isAnonymous ? 'justinfan123456' : 'justinfan'}`);
	}
	private onSocketClose: ((event: WebSocket.CloseEvent) => void) = event => {
		this.log?.info('Socket close');
		this.cleanupKeepalive();
		this.channels.forEach(channel => {
			this.pendingChannels.add(channel.name);
			channel.isJoined = false;
		});
		this.channels.clear();
		this.emit('socketClose', event.code, event.reason, event.wasClean);
	}
	private onSocketError: ((event: WebSocket.ErrorEvent) => void) = event => {
		this.log?.error('Socket error:', event);
		this.emit('socketError', event);
	}
	protected onIrcLine: ((line: string, now?: number) => void) = (line, now = Date.now()) => {
		const message = parseIrcLine(line);
		if(!message) {
			return;
		}
		this.emit('ircMessage', message);
		if(message.unknownTags) {
			this.log?.debug('Unknown tags:', message);
		}
		switch(message.command) {
			case 'CAP': {
				if(!message.raw.includes(' * ACK :')) {
					this.emit('unhandledCommand', message);
				}
				else {
					this.log?.trace('CAP ACK received');
				}
				break;
			}
			case 'PING': {
				this.send(`PONG :${message.params}`);
				break;
			}
			case 'PONG': {
				this.onCommand_PONG(message, now);
				break;
			}
			case 'JOIN': {
				this.onCommand_JOIN(message as JOIN.Message);
				break;
			}
			case 'PART': {
				this.onCommand_PART(message as PART.Message);
				break;
			}
			case 'GLOBALUSERSTATE': {
				this.onCommand_GLOBALUSERSTATE(message as GLOBALUSERSTATE.Message);
				break;
			}
			case 'USERSTATE': {
				this.onCommand_USERSTATE(message as USERSTATE.Message);
				break;
			}
			case 'ROOMSTATE': {
				this.onCommand_ROOMSTATE(message as ROOMSTATE.Message);
				break;
			}
			case 'NOTICE': {
				this.onCommand_NOTICE(message as NOTICE.Message);
				break;
			}
			case 'USERNOTICE': {
				this.onCommand_USERNOTICE(message as USERNOTICE.Message);
				break;
			}
			case 'PRIVMSG': {
				this.onCommand_PRIVMSG(message as PRIVMSG.Message);
				break;
			}
			case 'CLEARMSG': {
				this.onCommand_CLEARMSG(message as CLEARMSG.Message);
				break;
			}
			case 'CLEARCHAT': {
				this.onCommand_CLEARCHAT(message as CLEARCHAT.Message);
				break;
			}
			case '001': {
				this.log?.info('Connected to IRC');
				this.identity.nick = message.params[0];
				this.log?.verbose('Nick is:', this.identity.nick);
				this.emit('identity', this.identity);
				this.joinPendingChannels();
				// Intentionally fall through
			}
			case '002':
			case '003':
			case '004':
			case '353':
			case '366':
			case '375':
			case '372':
			case '376': {
				this.log?.verbose('Ignoring command:', message);
				this.emit('ignoredCommand', message);
				break;
			}
			case '421': {
				this.log?.warn('Unknown command:', message);
				this.emit('unhandledCommand', message);
				break;
			}
			default: {
				this.log?.warn('Unhandled command:', message);
				this.emit('unhandledCommand', message);
			}
		}
	}
	private onSocketMessage: ((event: WebSocket.MessageEvent) => void) = event => {
		const now = Date.now();
		const lines = event.data.toString().trim().split('\r\n');
		this.emit('socketMessage', event, lines);
		lines.forEach(line => this.onIrcLine(line, now));
	}
	_debugProcessMessage(data: string) {
		this.onSocketMessage({ data } as any);
	}

	isConnected(): this is { socket: WebSocket & { readyState: typeof WebSocket.OPEN } } {
		return !!this.socket && this.socket.readyState === WebSocket.OPEN;
	}

	private send(data: string) {
		if(!this.isConnected()) {
			throw new Error('Not connected');
		}
		this.socket.send(data);
	}

	private async joinPendingChannels() {
		const channels = [ ...this.pendingChannels ];
		for(const channel of channels) {
			await this.join(channel);
			this.pendingChannels.delete(channel);
		}
	}

	private startKeepalive() {
		if(this.keepalive.interval) {
			throw new Error('Keepalive already started');
		}
		this.keepalive.interval = setInterval(() => {
			this.keepalive.lastPingOut = Date.now();
			this.send('PING :tmi.js');
			if(this.keepalive.timeout) {
				clearTimeout(this.keepalive.timeout);
			}
			this.keepalive.timeout = setTimeout(() => {
				// TODO: Reconnect?
				console.error('Ping timeout');
				this.socket?.close();
			}, this.keepalive.timeoutMs);
		}, this.keepalive.intervalMs);
	}
	private cleanupKeepalive() {
		if(this.keepalive.interval) {
			clearInterval(this.keepalive.interval);
			this.keepalive.interval = undefined;
		}
		if(this.keepalive.timeout) {
			clearTimeout(this.keepalive.timeout);
			this.keepalive.timeout = undefined;
		}
		this.keepalive.lastPingOut = undefined;
		this.keepalive.lastLatencyMs = undefined;
	}
	get latency() {
		return this.keepalive.lastLatencyMs;
	}

	private getChannel(channelName: string | IrcMessage): Channel | ChannelTemporary {
		if(typeof channelName !== 'string') {
			channelName = channelName.channel ?? channelName.params[0];
		}
		channelName = Channel.normalizeName(channelName);
		const channel = this.channels.get(channelName);
		return channel ? channel : new ChannelTemporary(channelName);
	}

	////////////////////////////////////////////////////////////////////////////

	private onCommand_PONG(_e: IrcMessage, now: number) {
		if(this.keepalive.lastPingOut === undefined) {
			this.log?.warn('Received PONG before sending PING');
			return;
		}
		if(this.keepalive.timeout) {
			clearTimeout(this.keepalive.timeout);
			this.keepalive.timeout = undefined;
		}
		this.keepalive.lastLatencyMs = now - this.keepalive.lastPingOut;
		this.emit('pong', this.keepalive.lastLatencyMs);
	}
	private onCommand_GLOBALUSERSTATE(e: GLOBALUSERSTATE.Message) {
		this.emit('GLOBALUSERSTATE', e);
		if(!this.identity.isAnonymous) {
			this.identity.userId = e.tags.userId;
			this.identity.color = e.tags.color;
		}
	}
	private onCommand_USERSTATE(e: USERSTATE.Message) {
		this.emit('USERSTATE', e);
	}
	private onCommand_ROOMSTATE(e: ROOMSTATE.Message) {
		const channel = this.getChannel(e);
		channel.isJoined = true;
		channel.id = e.tags.roomId;
		channel.roomState = e.tags;
		this.emit('ROOMSTATE', e);
		this.emit('roomState', {
			channel,
			roomState: e.tags
		});
	}
	private onCommand_JOIN(e: JOIN.Message) {
		this.emit('JOIN', e);
		const channel = this.getChannel(e.channel);
		channel.isJoined = true;
		this.queuedEmit('join', {
			channel,
			isClient: e.prefix.nick === this.identity.nick,
			user: {
				name: e.prefix.nick
			}
		});
	}
	private onCommand_PART(e: PART.Message) {
		this.emit('PART', e);
		const channel = this.getChannel(e.channel);
		const isClient = e.prefix.nick === this.identity.nick;
		if(isClient) {
			channel.isJoined = false;
			this.channels.delete(channel.name);
		}
		this.emit('part', {
			channel,
			isClient,
			user: {
				name: e.prefix.nick
			}
		});
	}
	private onCommand_NOTICE(e: NOTICE.Message) {
		// ':tmi.twitch.tv NOTICE * :Login unsuccessful'
		// ':tmi.twitch.tv NOTICE * :Login authentication failed'
		this.emit('NOTICE', e);
		this.log?.info('NOTICE:', e);
		switch(e.params[1]) {
			case 'Login unsuccessful':
			case 'Login authentication failed': {
				this.log?.error('Login failed');
				// this.emit('loginFailure');
				break;
			}
			default: {
				this.log?.warn('Unhandled NOTICE:', e);
				this.emit('unhandledCommand', e);
			}
		}
	}
	private onCommand_USERNOTICE(e: USERNOTICE.Message) {
		this.emit('USERNOTICE', e);
		const { tags: baseTags, params } = e;
		const channel = this.getChannel(e);
		if('msgId' in baseTags) {
			switch(baseTags.msgId) {
				case 'sub': {
					const tags = baseTags as USERNOTICE.MsgId_Sub.TagsData;
					this.emit('sub', {
						channel,
						user: {
							id: tags.userId,
							name: tags.login,
							displayName: tags.displayName,
							badgeInfo: tags.badgeInfo,
							badges: tags.badges,
							color: tags.color,
							isMod: tags.mod,
							isSubscriber: true,
							type: tags.userType,
						},
						message: {
							system: tags.systemMsg,
						},
						subscription: {
							plan: {
								name: tags.msgParamSubPlanName,
								plan: tags.msgParamSubPlan,
								tier: tags.msgParamSubPlan === 'Prime' ? 1 : (<const>{ 1000: 1, 2000: 2, 3000: 3 })[tags.msgParamSubPlan] ?? 1,
								isPrime: tags.msgParamSubPlan === 'Prime',
							},
							multiMonth: {
								duration: tags.msgParamMultimonthDuration,
							}
						}
					});
					break;
				}
			}
		}
	}
	private onCommand_PRIVMSG(e: PRIVMSG.Message) {
		this.emit('PRIVMSG', e);
		const { channel: channelName, tags, prefix } = e;
		const channel = this.getChannel(e);
		let { params: [ text ] } = e;
		const isAction = text.startsWith(ACTION_MESSAGE_PREFIX) && text.endsWith(ACTION_MESSAGE_SUFFIX);
		if(isAction) {
			text = text.slice(8, -1);
		}
		const isCustomReward = 'customRewardId' in tags && tags.customRewardId !== '';
		const user: PRIVMSG.Event_Message['user'] = {
			id: tags.userId,
			name: prefix.nick,
			displayName: tags.displayName,

			color: tags.color,

			badges: tags.badges,
			badgeInfo: tags.badgeInfo,

			isMod: tags.mod,
			isSubscriber: tags.subscriber,
			isFounder: tags.badges.has('founder'),
			type: tags.userType,

			isReturningChatter: tags.returningChatter
		};
		const hasMsgId = 'msgId' in tags;
		const message: PRIVMSG.Event_Message['message'] = {
			id: tags.id,
			text,
			flags: tags.flags,
			emotes: tags.emotes,
			isAction,
			isIntroduction: hasMsgId && tags.msgId === 'user-intro',
			isFirstMessageByUser: tags.firstMsg,
			wasAcceptedAfterAutomod: hasMsgId && tags.msgId === '' && tags.customRewardId === '',
		};
		const hasParent = 'replyParentMsgId' in tags;
		let parent: PRIVMSG.Event_Message['parent'] | undefined;
		if(hasParent) {
			parent = {
				id: tags.replyParentMsgId,
				text: tags.replyParentMsgBody,
				user: {
					id: tags.replyParentUserId,
					name: tags.replyParentDisplayName,
					displayName: tags.replyParentDisplayName,
				},
				thread: {
					id: tags.replyThreadParentMsgId,
					user: {
						name: tags.replyThreadParentUserLogin
					}
				}
			};
		}
		const isCheer = 'bits' in tags;
		let cheer: PRIVMSG.Event_Message['cheer'] | undefined;
		if(isCheer) {
			cheer = { bits: tags.bits };
		}
		const isPinnedPaid = 'pinnedChatPaidAmount' in tags;
		let pinned: PRIVMSG.Event_Message['pinned'] | undefined;
		if(isPinnedPaid) {
			pinned = {
				type: 'paid',
				amount: tags.pinnedChatPaidAmount,
				amountCanonical: tags.pinnedChatPaidCanonicalAmount,
				currency: tags.pinnedChatPaidCurrency,
				exponent: tags.pinnedChatPaidExponent,
				getComputedAmount() {
					// return this.amount / (10 ** this.exponent);
					return this.amount / exponentLookup[this.exponent];
				},
				getFormattedAmount(opts) {
					const value = this.getComputedAmount();
					return value.toLocaleString(undefined, {
						...opts,
						currency: tags.pinnedChatPaidCurrency,
						currencyDisplay: opts?.currencyDisplay ?? 'symbol',
						style: 'currency'
					});
				},
				level: tags.pinnedChatPaidLevel,
				isSystemMessage: tags.pinnedChatPaidIsSystemMessage
			};
		}
		let reward: PRIVMSG.Event_Message['reward'] | undefined;
		const isReward = hasMsgId && (tags.msgId === 'highlighted-message' || tags.msgId === 'skip-subs-mode-message');
		if(isCustomReward) {
			reward = { type: 'custom', id: tags.customRewardId };
		}
		else if(isReward) {
			reward = { type: tags.msgId };
		}
		this.emit('message', {
			channel, user, message, parent, cheer, pinned, reward, tags,
			reply: text => this.reply(channelName, text, tags.id)
		});
	}
	private onCommand_CLEARMSG(e: CLEARMSG.Message) {
		const { tags } = e;
		this.emit('CLEARMSG', e);
		this.emit('deleteMessage', {
			channel: this.getChannel(e),
			id: tags.targetMsgId,
			user: {
				name: tags.login,
			},
			timestamp: tags.tmiSentTs
		});
	}
	private onCommand_CLEARCHAT(e: CLEARCHAT.Message) {
		this.emit('CLEARCHAT', e);
		const { tags, params } = e;
		const [ name ] = params;
		if(name !== undefined) {
			if(tags.banDuration !== undefined) {
				this.emit('timeout', {
					// Can only receive a ban/timeout for a channel you're in, therefore it's safe to assume the channel is
					// already joined and in the channel map.
					channel: this.getChannel(e) as Channel,
					user: {
						id: tags.targetUserId,
						name
					},
					banSeconds: tags.banDuration,
					tags: tags as CLEARCHAT.Event_Timeout['tags'],
					timestamp: tags.tmiSentTs
				});
			}
			else {
				this.emit('ban', {
					// Can only receive a ban/timeout for a channel you're in, therefore it's safe to assume the channel is
					// already joined and in the channel map.
					channel: this.getChannel(e) as Channel,
					user: {
						id: tags.targetUserId,
						name
					},
					tags: tags as CLEARCHAT.Event_Ban['tags'],
					timestamp: tags.tmiSentTs
				});
			}
		}
		else {
			this.emit('chatCleared', {
				channel: this.getChannel(e) as Channel,
				tags,
				timestamp: tags.tmiSentTs
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////

	private waitForIrcCommand<T extends Extract<IrcCommands, keyof ClientEvents>, Message = IrcMessage<T>>(opts: WaitForIrcCommandOptions<T, Message>): Promise<Message> {
		const { command, filterCallback, badNotices, timeoutMs = 10_000 } = opts;
		return new Promise((resolve, reject) => {
			const cleanup = () => {
				clearTimeout(timeout);
				this.removeListener(command, onMessage);
				this.removeListener('NOTICE', onNotice);
			};
			const timeout = setTimeout(() => {
				cleanup();
				reject(new Error(`Timed out waiting for ${command}`));
			}, timeoutMs);
			const onMessage = (message: IrcMessage) => {
				if(!filterCallback(message as Message)) {
					return;
				}
				cleanup();
				resolve(message as Message);
			};
			const onNotice = (message: NOTICE.Message) => {
				if(!badNotices!.includes(message.tags.msgId)) {
					// Probably not the notice we're looking for
					return;
				}
				cleanup();
				reject(new Error(`Received NOTICE "${message.tags.msgId}" while waiting for "${command}"`));
			};
			this.on(command, onMessage);
			if(badNotices && badNotices.length) {
				this.on('NOTICE', onNotice);
			}
		});
	}
	private waitForIrcCommandByChannel<T extends Extract<IrcCommands, keyof ClientEvents>, Message = IrcMessage<T>>(opts: WaitForIrcCommandByChannelOptions<T, Message>): Promise<Message> {
		const { command, channelName, filterCallback, badNotices, timeoutMs } = opts;
		const channelNameTarget = Channel.normalizeName(typeof channelName === 'string' ? channelName : channelName.name);
		return this.waitForIrcCommand<T>({
			command,
			filterCallback: message => {
				if(!message.channel || (filterCallback && !filterCallback(message as Message))) {
					return false;
				}
				const testName = Channel.normalizeName(message.channel);
				return testName === channelNameTarget;
			},
			badNotices,
			timeoutMs
		}) as Promise<Message>;
	}

	////////////////////////////////////////////////////////////////////////////

	/**
	 * Join a channel by name. The channel name will be normalized.
	 */
	async join(channelName: string): Promise<Channel> {
		channelName = Channel.normalizeName(channelName);
		if(this.channels.has(channelName)) {
			// TODO: Should it throw an error here?
			// throw new Error(`Already joined #${channelName}`);
			return this.channels.get(channelName)!;
		}
		const channel = new Channel(channelName);
		this.channels.set(channelName, channel);
		this.send(`JOIN #${channelName}`);
		await this.waitForIrcCommandByChannel<'JOIN'>({ command: 'JOIN', channelName });
		return channel;
	}
	/**
	 * Leave/part a channel by name. The channel name will be normalized.
	 */
	async part(channelName: string | Channel): Promise<void> {
		if(typeof channelName !== 'string') {
			channelName = channelName.name;
		}
		channelName = Channel.normalizeName(channelName);
		if(!this.channels.has(channelName)) {
			// TODO: Should it throw an error here?
			// throw new Error(`Not joined #${channelName}`);
			return;
		}
		this.channels.delete(channelName);
		this.send(`PART #${channelName}`);
		await this.waitForIrcCommandByChannel<'PART'>({ command: 'PART', channelName });
	}

	/**
	 * Send a message to a channel. The channel name will be normalized. Messages must be <= 500 characters in length.
	 * Cannot send messages if the client is logged in anonymously.
	 */
	async say(channelName: string | Channel, message: string, tags: Record<string, string> = {}, { isReply = false } = {}): Promise<SayReturnValue> {
		if(this.identity.isAnonymous) {
			throw new Error('Cannot send messages as anonymous');
		}
		else if(typeof message !== 'string' || message.length === 0) {
			throw new Error('Message is empty or not a string');
		}
		else if(message.length > 500) {
			// TODO: Suggest splitting the message into multiple messages?
			throw new Error('Message is too long (max 500 characters)');
		}
		channelName = Channel.normalizeName(channelName);
		// TODO: Pick a sufficiently random nonce
		const nonce = Math.random().toString(36).slice(2);
		const fullNonce = <const>`tmi.js_${nonce}`;
		tags['client-nonce'] = fullNonce;
		const tagsString = Object.entries(tags).map(([ key, value ]) => `${escapeIrc(key)}=${escapeIrc(value)}`).join(';');
		this.send(`@${tagsString} PRIVMSG #${channelName} :${message}`);
		const userState = await this.waitForIrcCommandByChannel<'USERSTATE'>({
			command: 'USERSTATE',
			filterCallback: message => message.tags.clientNonce === fullNonce,
			channelName,
			badNotices: [
				'unrecognized_cmd',
				'msg_duplicate', 'msg_ratelimit', 'msg_r9k',
				'msg_rejected_mandatory',
				'msg_subsonly',
				'msg_timedout', 'msg_banned', 'msg_bad_characters',
				'msg_requires_verified_phone_number'
			].concat(isReply ? [ 'invalid_parent' ] : [])
		}) as USERSTATE.Message;
		return {
			channel: this.getChannel(userState),
			tags: userState.tags,
			user: this.identity
		}
	}
	/**
	 * Send a reply to a message in a channel. The channel name will be normalized.
	 *
	 * Note that reply messages received by Twitch will be prepended with an "at" symbol (@) followed by the reply
	 * message's username and space then truncated to 500 characters.
	 */
	async reply(channelName: string | Channel, message: string, replyMessageId: string): Promise<SayReturnValue>;
	async reply(messageEvent: PRIVMSG.Event, message: string): Promise<SayReturnValue>;
	async reply(channelNameorMessageEvent: string | Channel | PRIVMSG.Event, message: string, replyMessageId?: string): Promise<SayReturnValue> {
		let channelName: string | Channel;
		if(typeof channelNameorMessageEvent === 'string' || channelNameorMessageEvent instanceof Channel) {
			channelName = channelNameorMessageEvent;
		}
		else {
			channelName = channelNameorMessageEvent.channel;
			replyMessageId = channelNameorMessageEvent.message.id;
		}
		if(replyMessageId) {
			return this.say(channelName, message, { 'reply-parent-msg-id': replyMessageId }, { isReply: true });
		}
		else {
			return this.say(channelName, message);
		}
	}
	/**
	 * Note that reply messages received by Twitch will be prepended with an "at" symbol (@) followed by the reply
	 * message's username and space then truncated to 500 characters.
	 */
	async replyChain(channelName: string | Channel, messages: string[], targetMessageId?: string): Promise<SayReturnValue[]> {
		if(!messages.length) {
			return [];
		}
		const sentMessages: Awaited<ReturnType<typeof this.say>>[] = [];
		let lastId: string = targetMessageId ?? '';
		let index = 0;
		if(!lastId) {
			const baseMessage = await this.say(channelName, messages[index++]);
			lastId = baseMessage.tags.id;
			sentMessages.push(baseMessage);
		}
		for(; index < messages.length; index++) {
			const newMessage = await this.reply(channelName, messages[index], lastId);
			// TODO: Maybe add an option to create broken chains? So the replied to message that appears is the last
			// message? This isn't necessarily the best experience though.
			// lastId = newMessage.tags.id;
			sentMessages.push(newMessage);
		}
		return sentMessages;
	}

	/**
	 * Send a whisper to a user. The user name will be normalized.
	 * @private Not implemented yet.
	 */
	async whisper(_targetUser: string | { id: string; }, _message: string) {
		throw new Error('Not implemented');
	}
}