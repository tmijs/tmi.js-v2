import EventEmitter from 'eventemitter3';
import WebSocket from 'isomorphic-ws';
import { Channel, ChannelTemporary } from './Channel';
import { LogLevel, Logger } from './Logger';
import { Token } from './Token';
import type { IrcCommands, IrcMessage } from './irc/IrcMessage';
import type {
	GLOBALUSERSTATE,
	USERSTATE,
	JOIN,
	PART,
	ROOMSTATE,
	NOTICE,
	PRIVMSG,
	CLEARMSG,
	CLEARCHAT,
	USERNOTICE,
	ChatColor,
	SubPlan,
} from './irc/commands';
import { escapeIrc, parseIrcLine } from './irc/parser';
import { ACTION_MESSAGE_PREFIX, ACTION_MESSAGE_SUFFIX } from './utils/constants.js';

interface ClientOptions {
	initialChannels?: string[];
	log?: Logger;
	token?: ConstructorParameters<typeof Token>[0] | Token;
	wsOptions?: WebSocket.ClientOptions;
}

/* eslint-disable typescript-sort-keys/interface */
interface ClientEvents {
	socketOpen: [];
	socketClose: [code: number, reason: string, wasClean: boolean];
	socketError: [event: WebSocket.ErrorEvent];
	socketMessage: [event: WebSocket.MessageEvent, lines: string[]];

	identity: [identity: Identity];
	pong: [latencyRoundTripMs: number];
	unhandledCommand: [message: IrcMessage];
	ignoredCommand: [message: IrcMessage];

	ircMessage: [message: IrcMessage];

	GLOBALUSERSTATE: [message: GLOBALUSERSTATE.Message];
	USERSTATE: [message: USERSTATE.Message];
	ROOMSTATE: [message: ROOMSTATE.Message];
	JOIN: [message: JOIN.Message];
	PART: [message: PART.Message];
	NOTICE: [message: NOTICE.Message];
	USERNOTICE: [message: USERNOTICE.Message];
	PRIVMSG: [message: PRIVMSG.Message];
	CLEARMSG: [message: CLEARMSG.Message];
	CLEARCHAT: [message: CLEARCHAT.Message];

	join: [event: JOIN.Event];
	part: [event: PART.Event];

	roomState: [event: ROOMSTATE.Event];
	emoteOnly: [event: ROOMSTATE.Event_EmoteOnly];
	followersOnly: [event: ROOMSTATE.Event_FollowersOnly];
	uniqueMode: [event: ROOMSTATE.Event_UniqueMode];
	slowMode: [event: ROOMSTATE.Event_SlowMode];
	subsOnly: [event: ROOMSTATE.Event_SubsOnly];

	ban: [event: CLEARCHAT.Event_Ban];
	timeout: [event: CLEARCHAT.Event_Timeout];
	chatCleared: [event: CLEARCHAT.Event_ChatCleared];
	deleteMessage: [event: CLEARMSG.Event];

	message: [event: PRIVMSG.Event];

	sub: [event: USERNOTICE.MsgId_Sub.Event];
	resub: [event: USERNOTICE.MsgId_Resub.Event];
	subMysteryGift: [event: USERNOTICE.MsgId_SubMysteryGift.Event];
	subGift: [event: USERNOTICE.MsgId_SubGift.Event];
	paidUpgrade: [event: USERNOTICE.PaidUpgrade.Event];
	payForward: [event: USERNOTICE.PayForward.Event];
	viewerMilestone: [event: USERNOTICE.MsgId_ViewerMilestone.Event];
	bitsBadgeTier: [event: USERNOTICE.MsgId_BitsBadgeTier.Event];
	announcement: [event: USERNOTICE.MsgId_Announcement.Event];
	raid: [event: USERNOTICE.MsgId_Raid.Event];
	unraid: [event: USERNOTICE.MsgId_Unraid.Event];
}
/* eslint-enable typescript-sort-keys/interface */

interface Keepalive {
	/**
	 * The interval timer.
	 */
	interval?: ReturnType<typeof setInterval>;
	/**
	 * The interval in milliseconds to send a ping to the server.
	 */
	intervalMs: number;
	/**
	 * The last latency measurement in milliseconds. This is a round-trip time.
	 */
	lastLatencyMs?: number;
	/**
	 * The last timestamp a ping was sent to the server.
	 */
	lastPingOut?: number;
	/**
	 * The timeout timer.
	 */
	timeout?: ReturnType<typeof setTimeout>;
	/**
	 * The timeout in milliseconds to wait for a pong response from the server.
	 */
	timeoutMs: number;
}

interface Identity {
	/**
	 * The color of the user's name.
	 */
	color: ChatColor;
	/**
	 * Whether the user is anonymous.
	 */
	isAnonymous?: boolean;
	/**
	 * The IRC nickname of the user.
	 */
	nick?: string;
	token?: Token;
	/**
	 * The user ID of the user.
	 */
	userId?: string;
}

interface WaitForIrcCommandOptions<T, Message> {
	badNotices?: string[];
	command: T;
	filterCallback(this: void, message: Message): boolean;
	timeoutMs?: number;
}
interface WaitForIrcCommandByChannelOptions<T, Message> {
	badNotices?: string[];
	channelName: Channel | string;
	command: T;
	filterCallback?(this: void, message: Message): boolean;
	timeoutMs?: number;
}

interface SayReturnValue {
	channel: Channel | ChannelTemporary;
	tags: USERSTATE.TagsData;
	user: Identity;
}

export class Client extends EventEmitter<ClientEvents> {
	public socket?: WebSocket;

	private readonly keepalive: Keepalive;

	public log?: Logger;

	public identity: Identity;

	/**
	 * The channels that the client is currently JOINed to.
	 */
	public channels: Map<string, Channel>;

	public wsOptions?: WebSocket.ClientOptions;

	private pendingChannels: Set<string> = new Set();

	public constructor(opts: ClientOptions = {}) {
		super();
		this.log = opts.log ?? new Logger(LogLevel.Fatal);
		this.wsOptions = opts.wsOptions;
		this.keepalive = {
			intervalMs: 60_000,
			timeoutMs: 10_000,
		};
		this.identity = {
			get isAnonymous() {
				return this.token?.isAnonymous ?? true;
			},
			color: '',
			token: opts.token instanceof Token ? opts.token : new Token(opts.token),
		};
		this.channels = new Map();
		const initialChannels = (opts.initialChannels ?? []).map(Channel.normalizeName);
		this.pendingChannels = new Set(initialChannels);
	}

	public connect(): void {
		if (this.socket) {
			const { readyState } = this.socket;
			if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) {
				// TODO: Ignore if already connecting or connected?
				throw new Error('Already connected or connecting');
			}
		}

		const connectionOptions: ClientOptions['wsOptions'] = { ...this.wsOptions };
		this.socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443', 'irc', connectionOptions);
		this.socket.onopen = this.onSocketOpen;
		this.socket.onclose = this.onSocketClose;
		this.socket.onerror = this.onSocketError;
		this.socket.onmessage = this.onSocketMessage;
	}

	public disconnect(): void {
		this.socket?.close();
	}

	private async getIrcToken(): Promise<string> {
		const { token } = this.identity;
		if (token) {
			await token.getToken();
		}

		return token?.formatIrc() ?? Token.anonymousIrcToken;
		// return Token.anonymousToken;
	}

	private queuedEmit<T extends keyof ClientEvents>(event: T, ...args: ClientEvents[T]): void {
		queueMicrotask(() => this.emit(event, ...(args as any)));
	}

	private readonly onSocketOpen: () => Promise<void> = async () => {
		this.log?.info('Socket open');
		this.startKeepalive();
		this.emit('socketOpen');
		this.send('CAP REQ :twitch.tv/commands twitch.tv/tags');
		const token = await this.getIrcToken();
		// this.identity.isAnonymous = token === Token.anonymousIrcToken;
		this.send(`PASS ${token}`);
		this.send(`NICK ${this.identity.isAnonymous ? 'justinfan123456' : 'justinfan'}`);
	};

	private readonly onSocketClose: (event: WebSocket.CloseEvent) => void = (event) => {
		this.log?.info('Socket close');
		this.cleanupKeepalive();
		for (const channel of this.channels.values()) {
			this.pendingChannels.add(channel.name);
			channel.isJoined = false;
		}

		this.channels.clear();
		this.emit('socketClose', event.code, event.reason, event.wasClean);
	};

	private readonly onSocketError: (event: WebSocket.ErrorEvent) => void = (event) => {
		this.log?.error('Socket error:', event);
		this.emit('socketError', event);
	};

	protected onIrcLine: (line: string, now?: number) => void = (line, now = Date.now()) => {
		const message = parseIrcLine(line);
		if (!message) {
			return;
		}

		this.emit('ircMessage', message);
		if (message.unknownTags) {
			this.log?.debug('Unknown tags:', message);
		}

		switch (message.command) {
			case 'CAP': {
				if (message.raw.includes(' * ACK :')) {
					this.log?.trace('CAP ACK received');
				} else {
					this.emit('unhandledCommand', message);
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

			case 'RECONNECT': {
				this.log?.info('Received RECONNECT command');
				this.disconnect();
				this.connect();
				break;
			}

			case '001': {
				this.log?.info('Connected to IRC');
				this.identity.nick = message.params[0];
				this.log?.verbose('Nick is:', this.identity.nick);
				this.emit('identity', this.identity);
				void this.joinPendingChannels();
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
	};

	private readonly onSocketMessage: (event: WebSocket.MessageEvent) => void = (event) => {
		const now = Date.now();
		const data = event.data instanceof ArrayBuffer ? new TextDecoder('utf8').decode(event.data) : event.data;
		const lines = data.toString().trim().split('\r\n');
		this.emit('socketMessage', event, lines);
		for (const line of lines) {
			this.onIrcLine(line, now);
		}
	};

	public _debugProcessMessage(data: string) {
		this.onSocketMessage({ data } as any);
	}

	public isConnected(): this is { socket: WebSocket & { readyState: typeof WebSocket.OPEN } } {
		return this.socket?.readyState === WebSocket.OPEN;
	}

	private send(data: string) {
		if (!this.isConnected()) {
			throw new Error('Not connected');
		}

		this.socket.send(data);
	}

	private async joinPendingChannels() {
		const channels = [...this.pendingChannels];
		for (const channel of channels) {
			await this.join(channel);
			this.pendingChannels.delete(channel);
		}
	}

	private startKeepalive() {
		if (this.keepalive.interval) {
			throw new Error('Keepalive already started');
		}

		this.keepalive.interval = setInterval(() => {
			this.keepalive.lastPingOut = Date.now();
			this.send('PING :tmi.js');
			if (this.keepalive.timeout) {
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
		if (this.keepalive.interval) {
			clearInterval(this.keepalive.interval);
			this.keepalive.interval = undefined;
		}

		if (this.keepalive.timeout) {
			clearTimeout(this.keepalive.timeout);
			this.keepalive.timeout = undefined;
		}

		this.keepalive.lastPingOut = undefined;
		this.keepalive.lastLatencyMs = undefined;
	}

	public get latency() {
		return this.keepalive.lastLatencyMs;
	}

	private getChannel(channelName: IrcMessage | string, channelId?: string): Channel | ChannelTemporary {
		let parsedChannelName: string;
		let parsedChannelId = channelId;
		if (typeof channelName === 'string') {
			parsedChannelName = channelName;
		} else {
			if (!channelId) {
				parsedChannelId = channelName.tags.roomId;
			}

			parsedChannelName = channelName.channel ?? channelName.params[0];
		}

		parsedChannelName = Channel.normalizeName(parsedChannelName);
		const channel = this.channels.get(parsedChannelName);
		return channel ? channel : new ChannelTemporary(parsedChannelName, parsedChannelId);
	}

	/// /////////////////////////////////////////////////////////////////////////

	private onCommand_PONG(_e: IrcMessage, now: number) {
		if (this.keepalive.lastPingOut === undefined) {
			this.log?.warn('Received PONG before sending PING');
			return;
		}

		if (this.keepalive.timeout) {
			clearTimeout(this.keepalive.timeout);
			this.keepalive.timeout = undefined;
		}

		this.keepalive.lastLatencyMs = now - this.keepalive.lastPingOut;
		this.emit('pong', this.keepalive.lastLatencyMs);
	}

	private onCommand_GLOBALUSERSTATE(event: GLOBALUSERSTATE.Message) {
		this.emit('GLOBALUSERSTATE', event);
		if (!this.identity.isAnonymous) {
			this.identity.userId = event.tags.userId;
			this.identity.color = event.tags.color;
		}
	}

	private onCommand_USERSTATE(event: USERSTATE.Message) {
		this.emit('USERSTATE', event);
	}

	private onCommand_ROOMSTATE(event: ROOMSTATE.Message) {
		type E = ROOMSTATE.Event;
		const channel = this.getChannel(event);
		const isInitial = !channel.roomState;
		channel.isJoined = true;
		channel.id = event.tags.roomId;
		channel.roomState = Object.assign(channel.roomState ?? {}, event.tags);
		const change: E['change'] = { ...event.tags };
		if ('roomId' in change) {
			delete change.roomId;
		}

		this.emit('ROOMSTATE', event);
		this.emit('roomState', { channel, state: channel.roomState, isInitial, change });
		if (!isInitial) {
			if (change.emoteOnly !== undefined) {
				this.emit('emoteOnly', {
					channel,
					state: change.emoteOnly,
					isEnabled: change.emoteOnly,
				});
			}

			if (change.followersOnly !== undefined) {
				this.emit('followersOnly', {
					channel,
					state: change.followersOnly,
					isEnabled: change.followersOnly !== -1,
				});
			}

			if (change.r9k !== undefined) {
				this.emit('uniqueMode', {
					channel,
					state: change.r9k,
					isEnabled: change.r9k,
				});
			}

			if (change.slow !== undefined) {
				this.emit('slowMode', {
					channel,
					state: change.slow,
					isEnabled: change.slow !== 0,
				});
			}

			if (change.subsOnly !== undefined) {
				this.emit('subsOnly', {
					channel,
					state: change.subsOnly,
					isEnabled: change.subsOnly,
				});
			}
		}
	}

	private onCommand_JOIN(event: JOIN.Message) {
		this.emit('JOIN', event);
		const channel = this.getChannel(event.channel);
		channel.isJoined = true;
		this.queuedEmit('join', {
			channel,
			isClient: event.prefix.nick === this.identity.nick,
			user: {
				name: event.prefix.nick,
			},
		});
	}

	private onCommand_PART(event: PART.Message) {
		this.emit('PART', event);
		const channel = this.getChannel(event.channel);
		const isClient = event.prefix.nick === this.identity.nick;
		if (isClient) {
			channel.isJoined = false;
			this.channels.delete(channel.name);
		}

		this.emit('part', {
			channel,
			isClient,
			user: {
				name: event.prefix.nick,
			},
		});
	}

	private onCommand_NOTICE(event: NOTICE.Message) {
		// ':tmi.twitch.tv NOTICE * :Login unsuccessful'
		// ':tmi.twitch.tv NOTICE * :Login authentication failed'
		this.emit('NOTICE', event);
		this.log?.info('NOTICE:', event);
		switch (event.tags.msgId) {
			case 'emote_only_on':
			case 'emote_only_off':
			case 'followers_on_zero':
			case 'followers_on':
			case 'followers_off':
			case 'slow_on':
			case 'slow_off':
			case 'subs_on':
			case 'subs_off':
			case 'r9k_on':
			case 'r9k_off': {
				return;
			}
		}

		switch (event.params[1]) {
			case 'Login unsuccessful':
			case 'Login authentication failed': {
				this.log?.error('Login failed');
				// this.emit('loginFailure');
				break;
			}

			default: {
				this.log?.warn('Unhandled NOTICE:', event);
				this.emit('unhandledCommand', event);
			}
		}
	}

	private onCommand_USERNOTICE(event: USERNOTICE.Message) {
		/* eslint-disable unicorn/consistent-function-scoping */
		function getPlan(): USERNOTICE.SubscriptionPlanEmpty;
		function getPlan(subPlan: SubPlan): USERNOTICE.SubscriptionPlanNoName;
		function getPlan(subPlan: SubPlan, subPlanName: string): USERNOTICE.SubscriptionPlanFull;
		function getPlan(subPlan?: SubPlan, subPlanName?: string) {
			if (subPlan === undefined) {
				return {
					name: undefined,
					plan: undefined,
					tier: undefined,
					isPrime: false,
				};
			}

			return {
				name: subPlanName,
				plan: subPlan,
				tier: ({ 1_000: 1, 2_000: 2, 3_000: 3, Prime: 1 } as const)[subPlan] ?? 1,
				isPrime: subPlan === 'Prime',
			};
		}

		function getSimpleUser<ID = string, Name = string, DisplayName = string>(
			id: ID,
			name: Name,
			displayName: DisplayName,
		): USERNOTICE.SimpleUser<ID, Name, DisplayName>;
		function getSimpleUser<ID = string, Name = string, DisplayName = string>(
			id: ID,
			name: Name,
			displayName: DisplayName,
			isAnonymous: boolean,
		): USERNOTICE.SimpleUserMaybeAnonymous<ID, Name, DisplayName>;
		function getSimpleUser<ID = string, Name = string, DisplayName = string>(
			id: ID,
			name: Name,
			displayName: DisplayName,
			isAnonymous?: boolean,
		) {
			const user = { id, name, displayName };
			return isAnonymous === undefined ? user : { ...user, isAnonymous };
		}
		/* eslint-enable unicorn/consistent-function-scoping */

		function getUser(tags: USERNOTICE.SharedTagsData, checkForAnonymous?: false): USERNOTICE.User<typeof tags>;
		function getUser(
			tags: USERNOTICE.SharedTagsData,
			checkForAnonymous: true,
		): USERNOTICE.UserMaybeAnonymous<typeof tags>;
		function getUser(tags: USERNOTICE.SharedTagsData, checkForAnonymous = false) {
			const user: USERNOTICE.User<typeof tags> = {
				id: tags.userId,
				name: tags.login,
				displayName: tags.displayName,
				badgeInfo: tags.badgeInfo,
				badges: tags.badges,
				color: tags.color,
				isMod: tags.mod,
				isSubscriber: tags.subscriber,
				type: tags.userType,
			};
			if (checkForAnonymous) {
				const anonUser: USERNOTICE.UserMaybeAnonymous<typeof tags> = {
					...user,
					isAnonymous: tags.login === 'ananonymousgifter',
				};
				return anonUser;
			}

			return user;
		}

		function getMessage(tags: USERNOTICE.SharedTagsData): USERNOTICE.SystemMessage;
		function getMessage(tags: USERNOTICE.SharedTagsData, userMessage: string): USERNOTICE.UserMessage;
		function getMessage(tags: USERNOTICE.SharedTagsData, userMessage?: string) {
			return {
				id: tags.id,
				text: userMessage,
				system: tags.systemMsg,
				emotes: tags.emotes,
				flags: tags.flags,
			};
		}

		function getGoal(
			tags: USERNOTICE.MsgId_SubGift.TagsData | USERNOTICE.MsgId_SubMysteryGift.TagsData,
		): USERNOTICE.Goal | undefined {
			if (!tags.msgParamGoalContributionType) {
				return undefined;
			}

			return {
				contributionType: tags.msgParamGoalContributionType,
				// Match the Twitch Helix API so that the description will be an empty string if there's no goal description
				description: tags.msgParamGoalDescription ?? '',
				currentContributions: tags.msgParamGoalCurrentContributions!,
				targetContributions: tags.msgParamGoalTargetContributions!,
				userContributions: tags.msgParamGoalUserContributions!,
			};
		}

		this.emit('USERNOTICE', event);
		const { tags: baseTags, params } = event;
		const channel = this.getChannel(event);
		if ('msgId' in baseTags === false) {
			this.emit('unhandledCommand', event);
			return;
		}

		switch (baseTags.msgId) {
			case 'sub': {
				type E = USERNOTICE.MsgId_Sub.Event;
				const tags = baseTags as USERNOTICE.MsgId_Sub.TagsData;
				const user: E['user'] = getUser(tags);
				const message: E['message'] = getMessage(tags);
				const subscription: E['subscription'] = {
					plan: getPlan(tags.msgParamSubPlan, tags.msgParamSubPlanName),
					multiMonth: {
						duration: tags.msgParamMultimonthDuration,
					},
				};
				this.emit('sub', { channel, user, message, subscription });
				break;
			}

			case 'resub': {
				type E = USERNOTICE.MsgId_Resub.Event;
				const tags = baseTags as USERNOTICE.MsgId_Resub.TagsData;
				const user: E['user'] = getUser(tags);
				const message: E['message'] = getMessage(tags, params[0] ?? '');
				let gift: E['subscription']['gift'];
				if (tags.msgParamWasGifted) {
					gift = {
						gifter: getSimpleUser(
							tags.msgParamGifterId!,
							tags.msgParamGifterLogin!,
							tags.msgParamGifterName!,
							tags.msgParamAnonGift!,
						),
						monthBeingRedeemed: tags.msgParamGiftMonths!,
						months: tags.msgParamGiftMonths!,
					};
				}

				let streak: E['subscription']['streak'];
				if (tags.msgParamShouldShareStreak) {
					streak = {
						months: tags.msgParamStreakMonths!,
					};
				}

				const subscription: E['subscription'] = {
					plan: getPlan(tags.msgParamSubPlan, tags.msgParamSubPlanName),
					multiMonth: {
						duration: tags.msgParamMultimonthDuration,
						tenure: tags.msgParamCumulativeMonths,
					},
					cumulativeMonths: tags.msgParamCumulativeMonths,
					streak,
					gift,
				};
				this.emit('resub', { channel, user, message, subscription });
				break;
			}

			case 'submysterygift': {
				type E = USERNOTICE.MsgId_SubMysteryGift.Event;
				const tags = baseTags as USERNOTICE.MsgId_SubMysteryGift.TagsData;
				const user: E['user'] = getUser(tags, true);
				const message: E['message'] = getMessage(tags);
				const subscription: E['subscription'] = {
					plan: getPlan(tags.msgParamSubPlan),
					mysteryGift: {
						id: tags.msgParamCommunityGiftId,
						count: tags.msgParamMassGiftCount,
						userTotal: tags.msgParamSenderCount,
						theme: tags.msgParamGiftTheme,
					},
				};
				const goal: E['goal'] = getGoal(tags);
				this.emit('subMysteryGift', { channel, user, message, subscription, goal });
				break;
			}

			case 'subgift': {
				type E = USERNOTICE.MsgId_SubGift.Event;
				const tags = baseTags as USERNOTICE.MsgId_SubGift.TagsData;
				const user: E['user'] = getUser(tags, true);
				const message: E['message'] = {
					id: tags.id,
					system: tags.systemMsg,
				};
				let mysteryGift: E['subscription']['mysteryGift'];
				if (tags.msgParamCommunityGiftId) {
					mysteryGift = {
						id: tags.msgParamCommunityGiftId,
						userTotal: tags.msgParamSenderCount,
						theme: tags.msgParamGiftTheme,
					};
				}

				const subscription: E['subscription'] = {
					plan: getPlan(tags.msgParamSubPlan, tags.msgParamSubPlanName),
					mysteryGift,
					gift: {
						months: tags.msgParamGiftMonths,
					},
				};
				const recipient: E['recipient'] = getSimpleUser(
					tags.msgParamRecipientId,
					tags.msgParamRecipientUserName,
					tags.msgParamRecipientDisplayName,
				);
				const goal: E['goal'] = getGoal(tags);
				this.emit('subGift', { channel, user, message, subscription, recipient, goal });
				break;
			}

			case 'giftpaidupgrade':
			case 'primepaidupgrade': {
				type E = USERNOTICE.PaidUpgrade.Event;
				const tags = baseTags as USERNOTICE.PaidUpgrade.TagsData;
				const user: E['user'] = getUser(tags);
				const message: E['message'] = getMessage(tags);
				const type = (
					{
						giftpaidupgrade: 'gift',
						primepaidupgrade: 'prime',
					} satisfies Record<typeof tags.msgId, E['type']>
				)[tags.msgId];
				let gifter: E['gifter'];
				let subscription: E['subscription'];
				if (tags.msgId === 'giftpaidupgrade') {
					gifter = getSimpleUser(undefined, tags.msgParamSenderLogin, tags.msgParamSenderName);
				} else {
					subscription = {
						plan: getPlan(tags.msgParamSubPlan),
					};
				}

				this.emit('paidUpgrade', { channel, user, message, type, gifter, subscription });
				break;
			}

			case 'standardpayforward':
			case 'communitypayforward': {
				type E = USERNOTICE.PayForward.Event;
				const tags = baseTags as USERNOTICE.PayForward.TagsData;
				const user: E['user'] = getUser(tags);
				const message: E['message'] = getMessage(tags);
				const type = (
					{
						standardpayforward: 'standard',
						communitypayforward: 'community',
					} satisfies Record<typeof tags.msgId, E['type']>
				)[tags.msgId];
				const priorGifter: E['priorGifter'] = getSimpleUser(
					tags.msgParamPriorGifterId,
					tags.msgParamPriorGifterUserName,
					tags.msgParamPriorGifterDisplayName,
					tags.msgParamPriorGifterAnonymous,
				);
				let recipient: E['recipient'];
				if ('msgParamRecipientId' in tags) {
					recipient = getSimpleUser(
						tags.msgParamRecipientId,
						tags.msgParamRecipientUserName,
						tags.msgParamRecipientDisplayName,
					);
				}

				this.emit('payForward', { channel, user, message, type, priorGifter, recipient });
				break;
			}

			case 'bitsbadgetier': {
				type E = USERNOTICE.MsgId_BitsBadgeTier.Event;
				const tags = baseTags as USERNOTICE.MsgId_BitsBadgeTier.TagsData;
				const user: E['user'] = getUser(tags);
				const message: E['message'] = getMessage(tags, params[0] ?? '');
				const badge: E['badge'] = {
					threshold: tags.msgParamThreshold,
				};
				this.emit('bitsBadgeTier', { channel, user, message, badge });
				break;
			}

			case 'announcement': {
				type E = USERNOTICE.MsgId_Announcement.Event;
				const tags = baseTags as USERNOTICE.MsgId_Announcement.TagsData;
				const user: E['user'] = getUser(tags);
				const message: E['message'] = getMessage(tags, params[0] ?? '');
				const announcement: E['announcement'] = {
					color: tags.msgParamColor,
				};
				this.emit('announcement', { channel, user, message, announcement });
				break;
			}

			case 'raid': {
				type E = USERNOTICE.MsgId_Raid.Event;
				const tags = baseTags as USERNOTICE.MsgId_Raid.TagsData;
				const user: E['user'] = getUser(tags);
				const message: E['message'] = getMessage(tags);
				const raid: E['raid'] = {
					profileImageURL: tags.msgParamProfileImageUrl,
					getProfileImageURL(size) {
						if (typeof size === 'undefined') {
						} else if (size <= 0) {
							throw new RangeError(`Invalid size: ${size}. Smallest size is 28`);
						} else if (![28, 50, 70, 150, 300, 600].includes(size)) {
							const compare = (
								(size: number) => (a: number, b: number) =>
									Math.abs(size - a) - Math.abs(size - b)
							)(size);
							const suggestion = [28, 50, 70, 150, 300, 600].sort(compare)[0];
							throw new RangeError(`Invalid size: ${size}. Based on the input, a suggested size is: ${suggestion}`);
						}

						const validatedSize = size ?? 50;

						return this.profileImageURL.replace('%s', `${validatedSize}x${validatedSize}`);
					},
					viewerCount: tags.msgParamViewerCount,
				};
				this.emit('raid', { channel, user, message, raid });
				break;
			}

			case 'unraid': {
				type E = USERNOTICE.MsgId_Unraid.Event;
				const tags = baseTags as USERNOTICE.MsgId_Unraid.TagsData;
				const user: E['user'] = getUser(tags);
				const message: E['message'] = getMessage(tags);
				this.emit('unraid', { channel, user, message });
				break;
			}

			case 'viewermilestone': {
				type E = USERNOTICE.MsgId_ViewerMilestone.Event;
				const tags = baseTags as USERNOTICE.MsgId_ViewerMilestone.TagsData;
				const user: E['user'] = getUser(tags);
				const message: E['message'] = getMessage(tags, params[0] ?? '');
				const milestone: E['milestone'] = {
					category: tags.msgParamCategory,
					value: tags.msgParamValue,
					id: tags.msgParamId,
				};
				this.emit('viewerMilestone', { channel, user, message, milestone });
				break;
			}

			default: {
				this.emit('unhandledCommand', event);
			}
		}
	}

	private onCommand_PRIVMSG(event: PRIVMSG.Message) {
		this.emit('PRIVMSG', event);
		type E = PRIVMSG.Event;
		const { channel: channelName, tags, prefix } = event;
		const channel = this.getChannel(event);
		let {
			params: [text],
		} = event;
		const isAction = text.startsWith(ACTION_MESSAGE_PREFIX) && text.endsWith(ACTION_MESSAGE_SUFFIX);
		if (isAction) {
			text = text.slice(8, -1);
		}

		const user: E['user'] = {
			id: tags.userId,
			name: prefix.nick,
			displayName: tags.displayName,

			color: tags.color,

			badges: tags.badges,
			badgeInfo: tags.badgeInfo,

			isMod: tags.mod,
			isSubscriber: tags.subscriber,
			isFounder: tags.badges.has('founder'),
			isVip: Boolean(tags.vip),
			type: tags.userType,

			isReturningChatter: tags.returningChatter,
		};
		const hasMsgId = 'msgId' in tags;
		const message: E['message'] = {
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
		let parent: E['parent'] | undefined;
		if (hasParent) {
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
						id: tags.replyThreadParentUserId,
						name: tags.replyThreadParentUserLogin,
						displayName: tags.replyThreadParentDisplayName,
					},
				},
			};
		}

		const isCheer = 'bits' in tags;
		let cheer: E['cheer'] | undefined;
		if (isCheer) {
			cheer = { bits: tags.bits };
		}

		let reward: E['reward'] | undefined;
		const isReward = hasMsgId && (tags.msgId === 'highlighted-message' || tags.msgId === 'skip-subs-mode-message');
		const isCustomReward = 'customRewardId' in tags && tags.customRewardId !== '';
		if (isCustomReward) {
			reward = { type: 'custom', id: tags.customRewardId };
		} else if (isReward) {
			reward = { type: tags.msgId };
		}

		this.emit('message', {
			channel,
			user,
			message,
			parent,
			cheer,
			reward,
			tags,
			reply: async (text) => this.reply(channelName, text, tags.id),
		});
	}

	private onCommand_CLEARMSG(event: CLEARMSG.Message) {
		const { tags, params } = event;
		this.emit('CLEARMSG', event);
		this.emit('deleteMessage', {
			channel: this.getChannel(event),
			user: {
				name: tags.login,
			},
			message: {
				id: tags.targetMsgId,
				text: params[0] ?? '',
			},
			timestamp: tags.tmiSentTs,
		});
	}

	private onCommand_CLEARCHAT(event: CLEARCHAT.Message) {
		this.emit('CLEARCHAT', event);
		const { tags, params } = event;
		const [name] = params;
		if (name === undefined) {
			this.emit('chatCleared', {
				channel: this.getChannel(event) as Channel,
				tags,
				timestamp: tags.tmiSentTs,
			});
		} else if (tags.banDuration === undefined) {
			this.emit('ban', {
				// Can only receive a ban/timeout for a channel you're in, therefore it's safe to assume the channel is
				// already joined and in the channel map.
				channel: this.getChannel(event) as Channel,
				user: {
					id: tags.targetUserId,
					name,
				},
				tags: tags as CLEARCHAT.Event_Ban['tags'],
				timestamp: tags.tmiSentTs,
			});
		} else {
			this.emit('timeout', {
				// Can only receive a ban/timeout for a channel you're in, therefore it's safe to assume the channel is
				// already joined and in the channel map.
				channel: this.getChannel(event) as Channel,
				user: {
					id: tags.targetUserId,
					name,
				},
				banSeconds: tags.banDuration,
				tags: tags as CLEARCHAT.Event_Timeout['tags'],
				timestamp: tags.tmiSentTs,
			});
		}
	}

	/// /////////////////////////////////////////////////////////////////////////

	private async waitForIrcCommand<T extends Extract<IrcCommands, keyof ClientEvents>, Message = IrcMessage<T>>(
		opts: WaitForIrcCommandOptions<T, Message>,
	): Promise<Message> {
		const { command, filterCallback, badNotices, timeoutMs = 10_000 } = opts;
		return new Promise((resolve, reject) => {
			/* eslint-disable @typescript-eslint/no-use-before-define */
			const cleanup = () => {
				clearTimeout(timeout);
				this.removeListener(command, onMessage);
				this.removeListener('NOTICE', onNotice);
			};
			/* eslint-enable @typescript-eslint/no-use-before-define */

			const timeout = setTimeout(() => {
				cleanup();
				reject(new Error(`Timed out waiting for ${command}`));
			}, timeoutMs);
			const onMessage = (message: IrcMessage) => {
				if (!filterCallback(message as Message)) {
					return;
				}

				cleanup();
				resolve(message as Message);
			};

			const onNotice = (message: NOTICE.Message) => {
				if (!badNotices!.includes(message.tags.msgId)) {
					// Probably not the notice we're looking for
					return;
				}

				cleanup();
				reject(new Error(`Received NOTICE "${message.tags.msgId}" while waiting for "${command}"`));
			};

			this.on(command, onMessage);
			if (badNotices?.length) {
				this.on('NOTICE', onNotice);
			}
		});
	}

	private async waitForIrcCommandByChannel<T extends Extract<IrcCommands, keyof ClientEvents>, Message = IrcMessage<T>>(
		opts: WaitForIrcCommandByChannelOptions<T, Message>,
	): Promise<Message> {
		const { command, channelName, filterCallback, badNotices, timeoutMs } = opts;
		const channelNameTarget = Channel.normalizeName(typeof channelName === 'string' ? channelName : channelName.name);
		return this.waitForIrcCommand<T>({
			command,
			filterCallback: (message) => {
				if (!message.channel || (filterCallback && !filterCallback(message as Message))) {
					return false;
				}

				const testName = Channel.normalizeName(message.channel);
				return testName === channelNameTarget;
			},
			badNotices,
			timeoutMs,
		}) as Promise<Message>;
	}

	/// /////////////////////////////////////////////////////////////////////////

	/**
	 * Join a channel by name. The channel name will be normalized.
	 */
	public async join(channelName: string): Promise<Channel> {
		const normalizedName = Channel.normalizeName(channelName);
		if (this.channels.has(normalizedName)) {
			// TODO: Should it throw an error here?
			// throw new Error(`Already joined #${channelName}`);
			return this.channels.get(normalizedName)!;
		}

		const channel = new Channel(normalizedName);
		this.channels.set(normalizedName, channel);
		this.send(`JOIN #${normalizedName}`);
		await this.waitForIrcCommandByChannel<'JOIN'>({ command: 'JOIN', channelName: normalizedName });
		return channel;
	}

	/**
	 * Leave/part a channel by name. The channel name will be normalized.
	 */
	public async part(channelName: Channel | string): Promise<void> {
		const normailzedName = Channel.normalizeName(channelName);
		if (!this.channels.has(normailzedName)) {
			// TODO: Should it throw an error here?
			// throw new Error(`Not joined #${channelName}`);
			return;
		}

		this.channels.delete(normailzedName);
		this.send(`PART #${normailzedName}`);
		await this.waitForIrcCommandByChannel<'PART'>({ command: 'PART', channelName: normailzedName });
	}

	/**
	 * Send a message to a channel. The channel name will be normalized. Messages must be &lt;= 500 characters in length.
	 * Cannot send messages if the client is logged in anonymously.
	 */
	public async say(
		channelName: Channel | string,
		message: string,
		tags: Record<string, number | string> = {},
		{ isReply = false } = {},
	): Promise<SayReturnValue> {
		if (this.identity.isAnonymous) {
			throw new Error('Cannot send messages as anonymous');
		} else if (typeof message !== 'string' || message.length === 0) {
			throw new Error('Message is empty or not a string');
		} else if (message.length > 500) {
			// TODO: Suggest splitting the message into multiple messages?
			throw new Error('Message is too long (max 500 characters)');
		}

		const normalizedChannelName = Channel.normalizeName(channelName);
		// TODO: Pick a sufficiently random nonce
		const nonce = Math.random().toString(36).slice(2);
		// TODO: Add the authorized user ID to the nonce
		const fullNonce = `tmi.js_${nonce}` as const;
		tags['client-nonce'] = fullNonce;
		const tagsString = Object.entries(tags)
			.map(([key, value]) => `${escapeIrc(key)}=${escapeIrc(value)}`)
			.join(';');
		this.send(`@${tagsString} PRIVMSG #${normalizedChannelName} :${message}`);
		const userState = (await this.waitForIrcCommandByChannel<'USERSTATE'>({
			command: 'USERSTATE',
			filterCallback: (message) => message.tags.clientNonce === fullNonce,
			channelName: normalizedChannelName,
			badNotices: [
				'unrecognized_cmd',
				'msg_duplicate',
				'msg_ratelimit',
				'msg_r9k',
				'msg_rejected_mandatory',
				'msg_subsonly',
				'msg_timedout',
				'msg_banned',
				'msg_bad_characters',
				'msg_requires_verified_phone_number',
			].concat(isReply ? ['invalid_parent'] : []),
		})) as USERSTATE.Message;
		return {
			channel: this.getChannel(userState),
			tags: userState.tags,
			user: this.identity,
		};
	}

	/**
	 * Send a reply to a message in a channel. The channel name will be normalized.
	 *
	 * Note that reply messages received by Twitch will be prepended with an "at" symbol (\@) followed by the reply
	 * message's username and space then truncated to 500 characters.
	 */
	public async reply(channelName: Channel | string, message: string, replyMessageId: string): Promise<SayReturnValue>;
	public async reply(messageEvent: PRIVMSG.Event, message: string): Promise<SayReturnValue>;
	public async reply(
		channelNameorMessageEvent: Channel | PRIVMSG.Event | string,
		message: string,
		replyMessageId?: string,
	): Promise<SayReturnValue> {
		let channelName: Channel | string;
		let replyId = replyMessageId;
		if (typeof channelNameorMessageEvent === 'string' || channelNameorMessageEvent instanceof Channel) {
			channelName = channelNameorMessageEvent;
		} else {
			channelName = channelNameorMessageEvent.channel;
			replyId = channelNameorMessageEvent.message.id;
		}

		if (replyId) {
			return this.say(channelName, message, { 'reply-parent-msg-id': replyId }, { isReply: true });
		} else {
			return this.say(channelName, message);
		}
	}

	/**
	 * Note that reply messages received by Twitch will be prepended with an "at" symbol (\@) followed by the reply
	 * message's username and space then truncated to 500 characters.
	 */
	public async replyChain(
		channelName: Channel | string,
		messages: string[],
		targetMessageId: string = '',
	): Promise<SayReturnValue[]> {
		if (!messages.length) {
			return [];
		}

		const sentMessages: Awaited<ReturnType<typeof this.say>>[] = [];
		let lastId = targetMessageId;
		let index = 0;
		if (!lastId) {
			const baseMessage = await this.say(channelName, messages[index++]);
			lastId = baseMessage.tags.id;
			sentMessages.push(baseMessage);
		}

		for (; index < messages.length; index++) {
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
	 *
	 * @privateRemarks Not implemented yet.
	 */
	protected async whisper(_targetUser: string | { id: string }, _message: string) {
		throw new Error('Not implemented');
	}
}
