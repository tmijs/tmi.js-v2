import { Channel } from '../Channel';
import { Client } from '../Client';
import { IrcMessage, ChannelString, TagsDataType } from './IrcMessage';
import { EmotesTag, MessageFlag } from './tags';
import { _parseTagsMapData } from './tags-data';

interface BadgesData {
	bits?: string;
	broadcaster?: string;
	founder?: string;
	moderator?: string;
	premium?: string;
	subscriber?: string;
	turbo?: string;
	vip?: string;
}
interface BadgesInfoData {
	subscriber?: string;
	founder?: string;
}

export interface Badges<Data = BadgesData> extends Map<keyof Data, unknown> {
	get<Key extends keyof Data>(key: Key): Data[Key];
	set<Key extends keyof Data>(key: Key, value: Data[Key]): this;
	has<Key extends keyof Data>(key: Key): boolean;
}

/**
 * Additional information about the user's badges.
 */
export type BadgesInfo = Badges<BadgesInfoData>;

export type ChatColor = '' | `#${string}`;
type EmoteSets = string[];
type UserType = '';

export type SubPlan = '1000' | '2000' | '3000' | 'Prime';

interface PrefixHostOnly {
	nick: undefined;
	user: undefined;
	host: string;
}
type PrefixFull = Record<'nick' | 'user' | 'host', string>;

export namespace GLOBALUSERSTATE {
	export interface TagsData {
		badgeInfo: BadgesInfo;
		badges: Badges;
		color: ChatColor;
		displayName: string;
		emoteSets: EmoteSets;
		userId: string;
		userType: UserType;
	}
	export interface Message extends IrcMessage<'GLOBALUSERSTATE', TagsData> {
		channel: ChannelString;
		prefix: PrefixHostOnly;
		params: [];
	}
}

export namespace USERSTATE {
	export interface TagsData {
		badgeInfo: BadgesInfo;
		badges: Badges;
		clientNonce?: string;
		color: ChatColor;
		displayName: string;
		emoteSets: EmoteSets;
		/**
		 * The user ID of the sent message.
		 */
		id: string;
		mod: boolean;
		subscriber: boolean;
		userType: UserType;
	}
	export interface Message extends IrcMessage<'USERSTATE', TagsData> {
		channel: ChannelString;
		prefix: PrefixHostOnly;
		params: [];
	}
}

export namespace ROOMSTATE {
	export interface TagsData {
		/**
		 * Determines whether the chat room allows only messages with emotes.
		 */
		emoteOnly?: boolean;
		/**
		 * Determines whether only followers can post messages in the chat room. The value indicates how long, in
		 * minutes, the user must have followed the broadcaster before posting chat messages. A value of -1 indicates
		 * that this setting is disabled.
		 */
		followersOnly?: number;
		/**
		 * Determines whether a user's messages must be unique. Applies only to messages with more than 9 characters.
		 */
		r9k?: boolean;
		/**
		 * The user ID of the broadcaster.
		 */
		roomId?: string;
		/**
		 * Determines how long, in seconds, users must wait between sending
		 * messages.
		 */
		slow?: number;
		/**
		 * Determines whether only subscribers and moderators can chat in the
		 * chat room.
		 */
		subsOnly?: boolean;
	}
	export interface Message extends IrcMessage<'ROOMSTATE', TagsData> {
		channel: ChannelString;
		prefix: PrefixHostOnly;
		params: [];
	}
	export interface Event {
		channel: Channel;
		roomState: TagsData;
	}
}

export namespace JOIN {
	export interface TagsData {
	}
	export interface Message extends IrcMessage<'JOIN', TagsData> {
		channel: ChannelString;
		prefix: PrefixFull;
		params: [];
	}
	export interface Event {
		channel: Channel;
		isClient: boolean;
		user: {
			name: Message['prefix']['nick'];
		};
	}
}
export namespace PART {
	export interface TagsData {
	}
	export interface Message extends IrcMessage<'PART', TagsData> {
		channel: ChannelString;
		prefix: PrefixFull;
		params: [];
	}
	export interface Event {
		channel: Channel;
		isClient: boolean;
		user: {
			name: Message['prefix']['nick'];
		};
	}
}

export namespace NOTICE {
	export interface TagsData {
		msgId: string;
	}
	export interface Message extends IrcMessage<'NOTICE', TagsData> {
		channel: ChannelString;
		prefix: PrefixFull;
		params: string[];
	}
}

export namespace PRIVMSG {
	/**
	 * The msg-id and custom-reward-id tags can be set to empty string at the
	 * same time for messages that were held for review by automod and then
	 * accepted.
	 */
	type MsgId_Reward = 'highlighted-message' | 'skip-subs-mode-message';
	type MsgId_Intro = 'user-intro';
	export interface TagsData {
		badgeInfo: BadgesInfo;
		badges: Badges;
		clientNonce?: string;
		color: ChatColor;
		displayName: string;
		emoteOnly?: boolean;
		emotes: EmotesTag;
		firstMsg: boolean;
		flags: MessageFlag[];
		id: string;
		mod: boolean;
		/**
		 * Identifies newer chatters who have chatted at least twice in the last 30 days.
		 */
		returningChatter: boolean;
		roomId: string;
		subscriber: boolean;
		tmiSentTs: number;
		turbo: boolean;
		userId: string;
		userType: UserType;
		vip: boolean;
	}
	interface TagsData_Reply extends TagsData {
		replyParentDisplayName: string;
		replyParentMsgBody: string;
		replyParentMsgId: string;
		replyParentUserId: string;
		replyParentUserLogin: string;
		replyThreadParentMsgId: string;
		replyThreadParentUserLogin: string;
		replyThreadParentDisplayName: string;
		replyThreadParentUserId: string;
	}
	interface TagsData_Cheer extends TagsData {
		bits: number;
	}
	interface TagsData_PinnedPaid extends TagsData {
		pinnedChatPaidAmount: number;
		pinnedChatPaidCanonicalAmount: number;
		pinnedChatPaidCurrency: string;
		pinnedChatPaidExponent: number;
		pinnedChatPaidLevel: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN' | 'EIGHT' | 'NINE' | 'TEN';
		pinnedChatPaidIsSystemMessage: boolean;
	}
	interface TagsData_Introduction extends TagsData {
		msgId: 'user-intro';
	}
	interface TagsData_Reward_Highlighted extends TagsData {
		msgId: 'highlighted-message';
	}
	interface TagsData_Reward_SkipSubsMode extends TagsData {
		msgId: 'skip-subs-mode-message';
	}
	interface TagsData_Reward_Custom extends TagsData {
		// msgId: MsgId_Reward;
		customRewardId: string;
	}
	// TODO: Will replies and custom rewards still work with being automod accepted?
	interface TagsData_AutomodAccepted extends TagsData {
		msgId: '';
		customRewardId: '';
	}

	////////////////////////////////////////////////////////////////////////////

	export interface Message extends IrcMessage<'PRIVMSG', TagsData | TagsData_Reply | TagsData_Cheer | TagsData_PinnedPaid | TagsData_Introduction | TagsData_Reward_Custom | TagsData_Reward_Highlighted | TagsData_Reward_SkipSubsMode | TagsData_AutomodAccepted> {
		channel: ChannelString;
		prefix: PrefixFull;
		params: [ string ];
	}
	export interface User {
		id: TagsData['userId'];
		name: Message['prefix']['nick'];
		displayName: TagsData['displayName'];

		color: TagsData['color'];

		badges: TagsData['badges'];
		badgeInfo: TagsData['badgeInfo'];

		isMod: TagsData['mod'];
		isVip: TagsData['vip'];
		isSubscriber: TagsData['subscriber'];
		isFounder: boolean; // founder in badges
		type: TagsData['userType'];

		isReturningChatter: boolean; // tags returning-chatter
	}
	export interface Event_Message<Tags = TagsData> {
		channel: Channel;
		user: User;
		message: {
			id: TagsData['id'];
			text: Message['params'][0];
			flags: TagsData['flags'];
			emotes: TagsData['emotes'];
			isAction: boolean; // Text starts with \x01ACTION and ends with \x01
			isIntroduction: boolean; // msg-id=user-intro
			isFirstMessageByUser: boolean; // tags first-msg
			wasAcceptedAfterAutomod: boolean; // msg-id= and custom-reward-id=
		};
		cheer?: Cheer; // tags bits
		pinned?: PinnedPaid; // tags has pinned-chat-paid-amount
		parent?: ReplyParent; // tags has reply-parent-msg-id
		reward?: Reward_Custom | Reward_HighlightedMessage | Reward_SkipSubsModeMessage;
		tags: Tags;
		// TODO: Implement returning Event_Reply
		// reply(text: string): Promise<Event_Reply>;
		reply(text: string): ReturnType<Client['reply']>;
	}
	export interface Event_Base extends Event_Message {}
	export interface ReplyParent {
		id: TagsData_Reply['replyParentMsgId'];
		text: TagsData_Reply['replyParentMsgBody'];
		user: {
			id: TagsData_Reply['replyParentUserId'];
			name: TagsData_Reply['replyParentUserLogin'];
			displayName: TagsData_Reply['replyParentDisplayName'];
		};
		thread: {
			id: TagsData_Reply['replyThreadParentMsgId'];
			user: {
				id: TagsData_Reply['replyThreadParentUserId'];
				name: TagsData_Reply['replyThreadParentUserLogin'];
				displayName: TagsData_Reply['replyThreadParentDisplayName'];
			};
		};
	}
	export interface Cheer {
		bits: TagsData_Cheer['bits'];
	}
	export interface PinnedPaid {
		type: 'paid';
		amount: TagsData_PinnedPaid['pinnedChatPaidAmount'];
		amountCanonical: TagsData_PinnedPaid['pinnedChatPaidCanonicalAmount'];
		currency: TagsData_PinnedPaid['pinnedChatPaidCurrency'];
		exponent: TagsData_PinnedPaid['pinnedChatPaidExponent'];
		getComputedAmount: () => number;
		getFormattedAmount: (opts?: Omit<Intl.NumberFormatOptions, 'currency' | 'style'>) => string;
		level: TagsData_PinnedPaid['pinnedChatPaidLevel'];
		isSystemMessage: TagsData_PinnedPaid['pinnedChatPaidIsSystemMessage'];
	}
	interface Reward_HighlightedMessage {
		type: 'highlighted-message';
	}
	interface Reward_SkipSubsModeMessage {
		type: 'skip-subs-mode-message';
	}
	interface Reward_Custom {
		type: 'custom';
		id: TagsData_Reward_Custom['customRewardId'];
	}
	export type Event = Event_Message;
}

/**
 * An individually deleted message.
 */
export namespace CLEARMSG {
	export interface TagsData {
		login: string;
		roomId: '';
		targetMsgId: string;
		tmiSentTs: number;
	}
	export interface Message extends IrcMessage<'CLEARMSG', TagsData> {
		channel: ChannelString;
		prefix: PrefixHostOnly;
		/**
		 * The text of the message that was deleted.
		 */
		params: [ string ];
	}
	export interface Event {
		channel: Channel;
		user: {
			name: TagsData['login'];
		};
		id: TagsData['targetMsgId'];
		timestamp: TagsData['tmiSentTs'];
	}
}

/**
 * A user was banned or timed out.
 */
export namespace CLEARCHAT {
	export interface TagsData {
		banDuration?: number;
		roomId: string;
		targetUserId?: string;
		tmiSentTs: number;
	}
	export interface Message extends IrcMessage<'CLEARCHAT', TagsData> {
		channel: ChannelString;
		prefix: PrefixHostOnly;
		/**
		 * The username of the user that was banned or timed out.
		 */
		params: [ string ] | [];
	}
	export interface Event_Ban {
		channel: Channel;
		/**
		 * The user that was banned.
		 */
		user: {
			id: TagsData['targetUserId'];
			name: Message['params'][0];
		};
		tags: Omit<Required<TagsData>, 'banDuration'>;
		timestamp: TagsData['tmiSentTs'];
	}
	export interface Event_Timeout {
		channel: Channel;
		/**
		 * The user that was timed out.
		 */
		user: {
			id: TagsData['targetUserId'];
			name: Message['params'][0];
		};
		/**
		 * The duration of the timeout in seconds.
		 */
		banSeconds: NonNullable<TagsData['banDuration']>;
		tags: Required<TagsData>;
		timestamp: TagsData['tmiSentTs'];
	}
	export interface Event_ChatCleared {
		channel: Channel;
		tags: Omit<TagsData, 'banDuration' | 'targetUserId'>;
		timestamp: TagsData['tmiSentTs'];
	}
}

export namespace USERNOTICE {
	export interface SharedTagsData {
		badgeInfo: BadgesInfo;
		badges: Badges;
		color: ChatColor;
		displayName: string;
		emotes: EmotesTag;
		flags: [];
		id: string;
		login: string;
		mod: boolean;
		roomId: string;
		subscriber: true;
		tmiSentTs: number;
		userId: string;
		userType: UserType;
	}
	export interface BaseMessage<TagsData extends TagsDataType> extends IrcMessage<'USERNOTICE', TagsData> {
		channel: ChannelString;
		prefix: PrefixHostOnly;
	}
	export interface Message extends BaseMessage<SharedTagsData> {
	}

	export namespace MsgId_Sub {
		export interface TagsData extends SharedTagsData {
			msgId: 'sub';
			msgParamCumulativeMonths: number;
			msgParamMonths: 0;
			msgParamMultimonthDuration: number; // 1
			msgParamMultimonthTenure: 0;
			msgParamShouldShareStreak: false;
			msgParamSubPlanName: string;
			msgParamSubPlan: SubPlan;
			msgParamWasGifted: false;
			// TODO: Get message
			systemMsg: string;
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [ string ];
		}
		export interface Event {
			channel: Channel;
			user: {
				id: TagsData['userId'];
				name: TagsData['login'];
				displayName: TagsData['displayName'];

				color: TagsData['color'];

				badges: TagsData['badges'];
				badgeInfo: TagsData['badgeInfo'];

				isMod: TagsData['mod'];
				isSubscriber: TagsData['subscriber'];
				type: TagsData['userType'];
			};
			message: {
				system: TagsData['systemMsg'];
			};
			subscription: {
				plan: {
					name: TagsData['msgParamSubPlanName'];
					plan: TagsData['msgParamSubPlan'];
					tier: 1 | 2 | 3;
					isPrime: boolean;
				};
				multiMonth: {
					duration: TagsData['msgParamMultimonthDuration'];
				};
			};
		}
	}
	export namespace MsgId_Resub {
		export interface TagsData extends SharedTagsData {
			mod: boolean;
			msgId: 'resub';
			msgParamAnonGift?: boolean;
			msgParamCumulativeMonths: number;
			msgParamGiftMonthBeingRedeemed?: number;
			msgParamGiftMonths?: number;
			msgParamGifterId?: string;
			msgParamGifterLogin?: string;
			msgParamGifterName?: string;
			msgParamMonths: 0;
			msgParamMultimonthDuration: number; // 1
			msgParamMultimonthTenure: number;
			msgParamShouldShareStreak: boolean;
			msgParamStreakMonths?: number;
			msgParamSubPlanName: string;
			msgParamSubPlan: SubPlan;
			msgParamWasGifted: boolean;
			// `${string} subscribed with Prime. They've subscribed for 5 months, currently on a 1 month streak!`
			systemMsg: string;
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [ string ];
		}
		export interface Event {
			channel: Channel;
			user: {
				id: TagsData['userId'];
				name: TagsData['login'];
				displayName: TagsData['displayName'];

				color: TagsData['color'];

				badges: TagsData['badges'];
				badgeInfo: TagsData['badgeInfo'];

				isMod: TagsData['mod'];
				isSubscriber: TagsData['subscriber'];
				type: TagsData['userType'];
			};
			message: {
				system: TagsData['systemMsg'];
				user: Message['params'][0];
				// TODO: Can the user message be an action? (/me)
				// isAction: boolean;
				flags: TagsData['flags'];
				emotes: TagsData['emotes'];
				id: TagsData['id'];
			};
			subscription: {
				cumulativeMonths: TagsData['msgParamCumulativeMonths'];
				plan: {
					tier: TagsData['msgParamSubPlan'];
					name: TagsData['msgParamSubPlanName'];
					isPrime: boolean;
				};
				multiMonth: {
					duration: TagsData['msgParamMultimonthDuration'];
					tenure: TagsData['msgParamMultimonthTenure'];
				};
				streak: {
					shared: TagsData['msgParamShouldShareStreak'];
					value: TagsData['msgParamStreakMonths'];
				};
				gift: {
					state: false; // TagsData['msgParamWasGifted'];
				} | {
					state: true; // TagsData['msgParamWasGifted'];
					gifter: {
						id: NonNullable<TagsData['msgParamGifterId']>;
						name: NonNullable<TagsData['msgParamGifterLogin']>;
						displayName: NonNullable<TagsData['msgParamGifterName']>;
						anonymous: NonNullable<TagsData['msgParamAnonGift']>;
					};
					// User is at month monthBeingRedeemed (1, 2, 3, ..., 11, 12) out of msgParamGiftMonths (3, 6, 12) months
					monthBeingRedeemed: TagsData['msgParamGiftMonthBeingRedeemed'];
					months: NonNullable<TagsData['msgParamGiftMonths']>;
				};
			};
		}
	}

	// submysterygift
	export namespace MsgId_SubMysteryGift {
		export interface TagsData extends SharedTagsData {
			msgId: 'submysterygift';
			msgParamGiftTheme: 'showlove' | 'party' | 'lul' | 'biblethump';
			// https://dev.twitch.tv/docs/api/reference/#get-creator-goals
			msgParamGoalContributionType?: 'SUBS' | 'SUB_POINTS';
			msgParamGoalCurrentContributions?: number;
			msgParamGoalDescription?: string;
			msgParamGoalTargetContributions?: number;
			msgParamGoalUserContributions?: number;
			msgParamMassGiftCount: number;
			msgParamOriginId: string;
			msgParamSenderCount: number;
			msgParamSubPlanName: string;
			msgParamSubPlan: SubPlan;
			// TODO: "Subs" for 1?
			// TODO: First time message?
			// `${string} is gifting ${number} Tier ${number} Subs to ${string}'s community! They've gifted a total of ${number} in the channel!`
			systemMsg: string;
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			gifter: {
				id: TagsData['userId'];
				name: TagsData['login'];
				displayName: TagsData['displayName'];

				color: TagsData['color'];

				badges: TagsData['badges'];
				badgeInfo: TagsData['badgeInfo'];

				isMod: TagsData['mod'];
				isSubscriber: TagsData['subscriber'];
				type: TagsData['userType'];
			};
			message: {
				system: TagsData['systemMsg'];
				id: TagsData['id'];
			};
			subscription: {
				plan: {
					tier: TagsData['msgParamSubPlan'];
				};
				mysteryGift: {
					// Number of gifts
					count: TagsData['msgParamMassGiftCount'];
					// Lifetime
					userTotal: TagsData['msgParamSenderCount'];
				};
			};
			goal?: {
				contributionType: NonNullable<TagsData['msgParamGoalContributionType']>;
				currentContributions: NonNullable<TagsData['msgParamGoalCurrentContributions']>;
				description: NonNullable<TagsData['msgParamGoalDescription']>;
				targetContributions: NonNullable<TagsData['msgParamGoalTargetContributions']>;
				userContributions: NonNullable<TagsData['msgParamGoalUserContributions']>;
			};
		}
	}

	// subgift
	export namespace MsgId_SubGift {
		export interface TagsData extends SharedTagsData {
			msgId: 'subgift';
			msgParamGiftMonths: number;
			msgParamMonths: number;
			msgParamOriginId: string;
			msgParamRecipientDisplayName: string;
			msgParamRecipientId: string;
			msgParamRecipientUserName: string;
			msgParamSenderCount: number;
			msgParamSubPlanName: string;
			msgParamSubPlan: SubPlan;
			// `${string} gifted a Tier 1 sub to ${string}!`
			systemMsg: string;
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			gifter: {
				id: TagsData['userId'];
				name: TagsData['login'];
				displayName: TagsData['displayName'];

				color: TagsData['color'];

				badges: TagsData['badges'];
				badgeInfo: TagsData['badgeInfo'];

				isMod: TagsData['mod'];
				isSubscriber: TagsData['subscriber'];
				type: TagsData['userType'];
			};
			message: {
				// `${string} gifted a Tier ${number} sub to ${string}!`
				system: TagsData['systemMsg'];
				id: TagsData['id'];
			};
			subscription: {
				plan: {
					tier: TagsData['msgParamSubPlan'];
					name: TagsData['msgParamSubPlanName'];
				};
				recipient: {
					id: TagsData['msgParamRecipientId'];
					name: TagsData['msgParamRecipientUserName'];
					displayName: TagsData['msgParamRecipientDisplayName'];
				};
				gift: {
					// TODO:
				};
			};
		}
	}

	// communitypayforward
	export namespace MsgId_CommunityPayForward {
		export interface TagsData extends SharedTagsData {
			msgId: 'communitypayforward';
			msgParamPriorGifterAnonymous: boolean;
			msgParamPriorGifterDisplayName: string;
			msgParamPriorGifterId: string;
			msgParamPriorGifterUserName: string;
			// `${string} is paying forward the Gift they got from ${string} to the community!`
			// TODO: anonymous version
			systemMsg: string;
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [ string ];
		}
		export interface Event {
			channel: Channel;
			user: {
				id: TagsData['userId'];
				name: TagsData['login'];
				displayName: TagsData['displayName'];

				color: TagsData['color'];

				badges: TagsData['badges'];
				badgeInfo: TagsData['badgeInfo'];

				isMod: TagsData['mod'];
				isSubscriber: TagsData['subscriber'];
				type: TagsData['userType'];
			};
			message: {
				system: TagsData['systemMsg'];
				id: TagsData['id'];
			};
			// TODO:
		}
	}

	// announcement
	export namespace MsgId_Announcement {
		export interface TagsData extends SharedTagsData {
			msgId: 'announcement';
			msgParamColor: 'PRIMARY' | 'BLUE' | 'GREEN' | 'ORANGE' | 'PURPLE';
			systemMsg: '';
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [ string ];
		}
		export interface Event {
			channel: Channel;
			user: {
				id: TagsData['userId'];
				name: TagsData['login'];
				displayName: TagsData['displayName'];

				color: TagsData['color'];

				badges: TagsData['badges'];
				badgeInfo: TagsData['badgeInfo'];

				isMod: TagsData['mod'];
				isSubscriber: TagsData['subscriber'];
				type: TagsData['userType'];
			};
			message: {
				user: Message['params'][0];
				color: TagsData['msgParamColor'];
			};
		}
	}
}
