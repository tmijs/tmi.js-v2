import type { Channel } from '../Channel';
import type { Client } from '../Client';
import type { IrcMessage, ChannelString, TagsDataType } from './IrcMessage';
import type { EmotesTag, MessageFlag } from './tags';

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
	founder?: string;
	subscriber?: string;
}

export interface Badges<Data = BadgesData> extends Map<keyof Data, unknown> {
	get<Key extends keyof Data>(key: Key): Data[Key];
	has<Key extends keyof Data>(key: Key): boolean;
	set<Key extends keyof Data>(key: Key, value: Data[Key]): this;
}

/**
 * Additional information about the user's badges.
 */
export type BadgeInfo = Badges<BadgesInfoData>;

export type ChatColor = '' | `#${string}`;
type EmoteSets = string[];
type UserType = '' | 'mod' | 'staff';

export type SubPlan = '1000' | '2000' | '3000' | 'Prime';
export type SubTier = 1 | 2 | 3;

interface PrefixHostOnly {
	host: string;
	nick: undefined;
	user: undefined;
}
type PrefixFull = Record<'host' | 'nick' | 'user', string>;

export declare namespace GLOBALUSERSTATE {
	export interface TagsData {
		badgeInfo: BadgeInfo;
		badges: Badges;
		color: ChatColor;
		displayName: string;
		emoteSets: EmoteSets;
		userId: string;
		userType: UserType;
	}
	export interface Message extends IrcMessage<'GLOBALUSERSTATE', TagsData> {
		channel: ChannelString;
		params: [];
		prefix: PrefixHostOnly;
	}
}

export declare namespace USERSTATE {
	export interface TagsData {
		badgeInfo: BadgeInfo;
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
		params: [];
		prefix: PrefixHostOnly;
	}
}

export declare namespace ROOMSTATE {
	export interface TagsData {
		/**
		 * Determines whether the chat room only allows messages with emotes.
		 */
		emoteOnly: boolean;
		/**
		 * Determines whether only followers can post messages in the chat room. The value indicates how long, in
		 * minutes, the user must have followed the broadcaster before posting chat messages. A value of -1 indicates
		 * that this setting is disabled. A value of `0` indicates the user must be following but without a minimum
		 * time.
		 */
		followersOnly: number;
		/**
		 * Determines whether a user's messages must be unique. Applies only to messages with more than 9 characters.
		 */
		r9k: boolean;
		/**
		 * The user ID of the broadcaster.
		 */
		roomId: string;
		/**
		 * Determines how long, in seconds, users must wait between sending messages. A value of `0` indicates that this
		 * setting is disabled.
		 */
		slow: number;
		/**
		 * Determines whether only subscribers and moderators can send messages in the channel.
		 */
		subsOnly: boolean;
	}
	export interface Message extends IrcMessage<'ROOMSTATE', TagsData> {
		channel: ChannelString;
		params: [];
		prefix: PrefixHostOnly;
	}
	export interface Event {
		change: Partial<Omit<TagsData, 'roomId'>>;
		channel: Channel;
		isInitial: boolean;
		state: TagsData;
	}

	export interface IndividualEvent<State> {
		channel: Channel;
		isEnabled: boolean;
		state: State;
	}

	export type Event_EmoteOnly = IndividualEvent<TagsData['emoteOnly']>;
	export type Event_FollowersOnly = IndividualEvent<TagsData['followersOnly']>;
	export type Event_UniqueMode = IndividualEvent<TagsData['r9k']>;
	export type Event_SlowMode = IndividualEvent<TagsData['slow']>;
	export type Event_SubsOnly = IndividualEvent<TagsData['subsOnly']>;
}

export declare namespace JOIN {
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	export interface TagsData {}
	export interface Message extends IrcMessage<'JOIN', TagsData> {
		channel: ChannelString;
		params: [];
		prefix: PrefixFull;
	}
	export interface Event {
		channel: Channel;
		isClient: boolean;
		user: {
			name: Message['prefix']['nick'];
		};
	}
}
export declare namespace PART {
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	export interface TagsData {}
	export interface Message extends IrcMessage<'PART', TagsData> {
		channel: ChannelString;
		params: [];
		prefix: PrefixFull;
	}
	export interface Event {
		channel: Channel;
		isClient: boolean;
		user: {
			name: Message['prefix']['nick'];
		};
	}
}

export declare namespace NOTICE {
	export interface TagsData {
		msgId: string;
	}
	export interface Message extends IrcMessage<'NOTICE', TagsData> {
		channel: ChannelString;
		params: string[];
		prefix: PrefixFull;
	}
}

export declare namespace PRIVMSG {
	/**
	 * The msg-id and custom-reward-id tags can be set to empty string at the
	 * same time for messages that were held for review by automod and then
	 * accepted.
	 */
	type MsgId_Reward = 'highlighted-message' | 'skip-subs-mode-message';
	type MsgId_Intro = 'user-intro';
	export interface TagsData {
		badgeInfo: BadgeInfo;
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
		vip?: boolean;
	}
	interface TagsData_Reply extends TagsData {
		replyParentDisplayName: string;
		replyParentMsgBody: string;
		replyParentMsgId: string;
		replyParentUserId: string;
		replyParentUserLogin: string;
		replyThreadParentDisplayName: string;
		replyThreadParentMsgId: string;
		replyThreadParentUserId: string;
		replyThreadParentUserLogin: string;
	}
	interface TagsData_Cheer extends TagsData {
		bits: number;
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
		customRewardId: '';
		msgId: '';
	}

	/// /////////////////////////////////////////////////////////////////////////

	export interface Message
		extends IrcMessage<
			'PRIVMSG',
			| TagsData
			| TagsData_AutomodAccepted
			| TagsData_Cheer
			| TagsData_Introduction
			| TagsData_Reply
			| TagsData_Reward_Custom
			| TagsData_Reward_Highlighted
			| TagsData_Reward_SkipSubsMode
		> {
		channel: ChannelString;
		params: [string];
		prefix: PrefixFull;
	}

	/* eslint-disable typescript-sort-keys/interface */
	export interface User {
		id: TagsData['userId'];
		name: Message['prefix']['nick'];
		displayName: TagsData['displayName'];

		color: TagsData['color'];

		badges: TagsData['badges'];
		badgeInfo: TagsData['badgeInfo'];

		isMod: TagsData['mod'];
		isVip: NonNullable<TagsData['vip']>;
		isSubscriber: TagsData['subscriber'];
		isFounder: boolean; // founder in badges
		type: TagsData['userType'];

		isReturningChatter: boolean; // tags returning-chatter
	}
	/* eslint-enable typescript-sort-keys/interface */
	export interface Event<Tags = TagsData> {
		channel: Channel;
		cheer?: Cheer; // tags bits
		message: {
			emotes: TagsData['emotes'];
			flags: TagsData['flags'];
			id: TagsData['id'];
			isAction: boolean; // Text starts with \x01ACTION and ends with \x01
			isFirstMessageByUser: boolean; // tags first-msg
			isIntroduction: boolean; // msg-id=user-intro
			text: Message['params'][0];
			wasAcceptedAfterAutomod: boolean; // msg-id= and custom-reward-id=
		};
		parent?: ReplyParent; // tags has reply-parent-msg-id
		// TODO: Implement returning Event_Reply
		// reply(text: string): Promise<Event_Reply>;
		reply(text: string): ReturnType<Client['reply']>;
		reward?: Reward_Custom | Reward_HighlightedMessage | Reward_SkipSubsModeMessage;
		tags: Tags;
		user: User;
	}
	export interface ReplyParent {
		id: TagsData_Reply['replyParentMsgId'];
		text: TagsData_Reply['replyParentMsgBody'];
		thread: {
			id: TagsData_Reply['replyThreadParentMsgId'];
			user: {
				displayName: TagsData_Reply['replyThreadParentDisplayName'];
				id: TagsData_Reply['replyThreadParentUserId'];
				name: TagsData_Reply['replyThreadParentUserLogin'];
			};
		};
		user: {
			displayName: TagsData_Reply['replyParentDisplayName'];
			id: TagsData_Reply['replyParentUserId'];
			name: TagsData_Reply['replyParentUserLogin'];
		};
	}
	export interface Cheer {
		bits: TagsData_Cheer['bits'];
	}
	interface Reward_HighlightedMessage {
		type: 'highlighted-message';
	}
	interface Reward_SkipSubsModeMessage {
		type: 'skip-subs-mode-message';
	}
	interface Reward_Custom {
		id: TagsData_Reward_Custom['customRewardId'];
		type: 'custom';
	}
}

/**
 * An individually deleted message.
 */
export declare namespace CLEARMSG {
	export interface TagsData {
		login: string;
		roomId: '';
		targetMsgId: string;
		tmiSentTs: number;
	}
	export interface Message extends IrcMessage<'CLEARMSG', TagsData> {
		channel: ChannelString;
		/**
		 * The text of the message that was deleted.
		 */
		params: [string];
		prefix: PrefixHostOnly;
	}
	export interface Event {
		channel: Channel;
		message: {
			id: TagsData['targetMsgId'];
			text: Message['params'][0];
		};
		timestamp: TagsData['tmiSentTs'];
		user: {
			name: TagsData['login'];
		};
	}
}

/**
 * A user was banned or timed out.
 */
export declare namespace CLEARCHAT {
	export interface TagsData {
		banDuration?: number;
		roomId: string;
		targetUserId?: string;
		tmiSentTs: number;
	}
	export interface Message extends IrcMessage<'CLEARCHAT', TagsData> {
		channel: ChannelString;
		/**
		 * The username of the user that was banned or timed out.
		 */
		params: [] | [string];
		prefix: PrefixHostOnly;
	}
	export interface Event_Ban {
		channel: Channel;
		tags: Omit<Required<TagsData>, 'banDuration'>;
		timestamp: TagsData['tmiSentTs'];
		/**
		 * The user that was banned.
		 */
		user: {
			id: TagsData['targetUserId'];
			name: Message['params'][0];
		};
	}
	export interface Event_Timeout {
		/**
		 * The duration of the timeout in seconds.
		 */
		banSeconds: NonNullable<TagsData['banDuration']>;
		channel: Channel;
		tags: Required<TagsData>;
		timestamp: TagsData['tmiSentTs'];
		/**
		 * The user that was timed out.
		 */
		user: {
			id: TagsData['targetUserId'];
			name: Message['params'][0];
		};
	}
	export interface Event_ChatCleared {
		channel: Channel;
		tags: Omit<TagsData, 'banDuration' | 'targetUserId'>;
		timestamp: TagsData['tmiSentTs'];
	}
}

export declare namespace USERNOTICE {
	export interface SharedTagsData {
		badgeInfo: BadgeInfo;
		badges: Badges;
		color: ChatColor;
		displayName: string;
		emotes: EmotesTag;
		flags: MessageFlag[];
		id: string;
		login: string;
		mod: boolean;
		roomId: string;
		subscriber: boolean;
		systemMsg: string;
		tmiSentTs: number;
		userId: string;
		userType: UserType;
	}
	export interface SimpleUser<ID = string, Name = string, DisplayName = string> {
		displayName: DisplayName;
		id: ID;
		name: Name;
	}
	export interface SimpleUserMaybeAnonymous<ID = string, Name = string, DisplayName = string, AnonymousReason = boolean>
		extends SimpleUser<ID, Name, DisplayName> {
		isAnonymous: AnonymousReason;
	}

	/* eslint-disable typescript-sort-keys/interface */
	export interface User<TagsData extends SharedTagsData = SharedTagsData> {
		id: TagsData['userId'];
		name: TagsData['login'];
		displayName: TagsData['displayName'];

		color: TagsData['color'];

		badges: TagsData['badges'];
		badgeInfo: TagsData['badgeInfo'];

		isMod: TagsData['mod'];
		isSubscriber: TagsData['subscriber'];
		type: TagsData['userType'];
	}
	/* eslint-enable typescript-sort-keys/interface */
	export type UserMaybeAnonymous<TagsData extends SharedTagsData = SharedTagsData> = User<TagsData> & {
		isAnonymous: boolean;
	};
	export interface SystemMessage {
		id: SharedTagsData['id'];
		system: SharedTagsData['systemMsg'];
	}
	// TODO: Can the user message be an action? (/me)
	// isAction: boolean;
	// TODO: Can the message be a user's first message?
	// isFirstMessageByUser: boolean;
	// TODO: Can the message be automodded?
	// wasAcceptedAfterAutomod: boolean;
	export interface UserMessage extends SystemMessage {
		emotes: SharedTagsData['emotes'];
		flags: SharedTagsData['flags'];
		text: string;
	}
	export interface SubscriptionPlanFull {
		isPrime: boolean;
		name: string;
		plan: SubPlan;
		tier: SubTier;
	}
	export interface SubscriptionPlanNoName {
		isPrime: boolean;
		name: undefined;
		plan: SubPlan;
		tier: SubTier;
	}
	export interface SubscriptionPlanEmpty {
		isPrime: boolean;
		name: undefined;
		plan: undefined;
		tier: undefined;
	}
	export interface BaseMessage<TagsData extends TagsDataType> extends IrcMessage<'USERNOTICE', TagsData> {
		channel: ChannelString;
		prefix: PrefixHostOnly;
	}
	export interface Message extends BaseMessage<SharedTagsData> {}
	// https://dev.twitch.tv/docs/api/reference/#get-creator-goals
	// The Helix API lists 5 types. 4 of them being sub related.
	// "subscription", "subscription_count", "new_subscription", "new_subscription_count"
	export type GoalContributionType = 'NEW_SUB_POINTS' | 'NEW_SUBS' | 'SUB_POINTS' | 'SUBS';
	export interface Goal<
		Type extends GoalContributionType = GoalContributionType,
		Description extends string = string,
		Current extends number = number,
		Target extends number = number,
		User extends number = number,
	> {
		contributionType: Type;
		currentContributions: Current;
		description: Description;
		targetContributions: Target;
		userContributions: User;
	}

	// `${string} subscribed at Tier ${number}.`
	// `${string} subscribed with Prime.`
	export namespace MsgId_Sub {
		export interface TagsData extends SharedTagsData {
			msgId: 'sub';
			msgParamCumulativeMonths: 1; // Always 1
			msgParamMonths: 0; // Always 0
			msgParamMultimonthDuration: number; // 1, 3, 6, ?
			msgParamMultimonthTenure: 0; // Always 0
			msgParamShouldShareStreak: false; // Always false
			msgParamSubPlan: SubPlan;
			msgParamSubPlanName: string;
			msgParamWasGifted: false; // Always false
		}
		export interface Message extends BaseMessage<TagsData> {
			params: [string];
		}
		export interface Event {
			channel: Channel;
			message: SystemMessage;
			subscription: {
				multiMonth: {
					duration: TagsData['msgParamMultimonthDuration'];
				};
				plan: SubscriptionPlanFull;
			};
			user: User;
		}
	}

	// `${string} subscribed at Tier ${number}. They've subscribed for ${number} months!`
	// `${string} subscribed at Tier ${number}. They've subscribed for ${number} months, currently on a ${number} month streak!`
	// `${string} subscribed with Prime. They've subscribed for ${number} months!`
	// `${string} subscribed with Prime. They've subscribed for ${number} months, currently on a ${number} month streak!`
	export namespace MsgId_Resub {
		export interface TagsData extends SharedTagsData {
			mod: boolean;
			msgId: 'resub';
			msgParamAnonGift?: boolean;
			msgParamCumulativeMonths: number;
			msgParamGiftMonthBeingRedeemed?: number;
			msgParamGiftMonths?: number; // 6, 12
			msgParamGifterId?: string;
			msgParamGifterLogin?: string;
			msgParamGifterName?: string;
			// Always 0
			msgParamMonths: 0;
			msgParamMultimonthDuration?: number; // 0, 1, 3
			msgParamMultimonthTenure?: number; // 0
			msgParamShouldShareStreak: boolean;
			msgParamStreakMonths?: number;
			msgParamSubPlan: SubPlan;
			msgParamSubPlanName: string;
			msgParamWasGifted: boolean;
			systemMsg: string;
		}
		export interface Message extends BaseMessage<TagsData> {
			params: [string];
		}
		export interface Event {
			channel: Channel;
			message: UserMessage;
			subscription: {
				cumulativeMonths: TagsData['msgParamCumulativeMonths'];
				gift?: {
					gifter: SimpleUserMaybeAnonymous<
						NonNullable<TagsData['msgParamGifterId']>,
						NonNullable<TagsData['msgParamGifterLogin']>,
						NonNullable<TagsData['msgParamGifterName']>,
						NonNullable<TagsData['msgParamAnonGift']>
					>;
					// User is at month monthBeingRedeemed (1, 2, 3, ..., 11, 12) out of msgParamGiftMonths (3, 6, 12) months
					// Value can be 0 (at least in two cases of anonymous gifts, streak both ways. Two non-anonymous gifts had non-zero values)
					monthBeingRedeemed: NonNullable<TagsData['msgParamGiftMonthBeingRedeemed']>;
					months: NonNullable<TagsData['msgParamGiftMonths']>;
				};
				multiMonth: {
					duration: TagsData['msgParamMultimonthDuration'];
					tenure: TagsData['msgParamMultimonthTenure'];
				};
				plan: SubscriptionPlanFull;
				streak?: {
					months: NonNullable<TagsData['msgParamStreakMonths']>;
				};
			};
			user: User;
		}
	}

	type GiftTheme = 'biblethump' | 'lul' | 'party' | 'showlove';

	// submysterygift
	// `${string} is gifting ${number} Tier ${number} Subs to ${string}'s community! They've gifted a total of ${number} in the channel!`,
	// `${string} is gifting ${number} Tier ${number} Subs to ${string}'s community!`,
	// `An anonymous user is gifting ${number} Tier ${number} Subs to ${string}'s community!`
	export namespace MsgId_SubMysteryGift {
		export interface TagsData extends SharedTagsData {
			msgId: 'submysterygift';
			msgParamCommunityGiftId: string;
			// These may not be the only values
			msgParamGiftTheme?: GiftTheme;
			msgParamGoalContributionType?: GoalContributionType;
			msgParamGoalCurrentContributions?: number;
			// Description may be omitted if it would be otherwise empty. (User set value)
			msgParamGoalDescription?: string;
			msgParamGoalTargetContributions?: number;
			msgParamGoalUserContributions?: number;
			msgParamMassGiftCount: number;
			msgParamOriginId: string;
			// May be ommited if the user is anonymous
			msgParamSenderCount?: number;
			// There is no msgParamSubPlanName for submysterygift
			// msgParamSubPlanName: string;
			msgParamSubPlan: SubPlan;
		}
		export interface Message extends BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			goal?: Goal<
				NonNullable<TagsData['msgParamGoalContributionType']>,
				NonNullable<TagsData['msgParamGoalDescription']>,
				NonNullable<TagsData['msgParamGoalCurrentContributions']>,
				NonNullable<TagsData['msgParamGoalTargetContributions']>,
				NonNullable<TagsData['msgParamGoalUserContributions']>
			>;
			message: SystemMessage;
			subscription: {
				mysteryGift: {
					// Number of gifts
					count: TagsData['msgParamMassGiftCount'];
					id: TagsData['msgParamCommunityGiftId'];
					theme: TagsData['msgParamGiftTheme'];
					// Lifetime
					userTotal: TagsData['msgParamSenderCount'];
				};
				plan: SubscriptionPlanNoName;
			};
			user: UserMaybeAnonymous;
		}
	}

	// subgift
	// `${string} gifted a Tier ${number} sub to ${string}!`
	// `${string} gifted ${number} months of Tier ${number} to ${string}. This is their first Gift Sub in the channel!`
	// `${string} gifted ${number} months of Tier ${number} to ${string}. They've gifted ${number} months in the channel!`
	// `${string} gifted a Tier ${number} sub to ${string}! They have given ${number} Gift Subs in the channel!`
	// `An anonymous user gifted a Tier ${number} sub to ${string}! ` // Extra space at the end
	export namespace MsgId_SubGift {
		export interface TagsData extends SharedTagsData {
			msgId: 'subgift';
			msgParamCommunityGiftId?: string;
			msgParamFunString: string;
			msgParamGiftMonths: number;
			msgParamGiftTheme?: GiftTheme;
			msgParamGoalContributionType?: GoalContributionType;
			msgParamGoalCurrentContributions?: number;
			msgParamGoalDescription?: string;
			msgParamGoalTargetContributions?: number;
			msgParamGoalUserContributions?: number;
			msgParamMonths: number;
			msgParamOriginId: string;
			msgParamRecipientDisplayName: string;
			msgParamRecipientId: string;
			msgParamRecipientUserName: string;
			msgParamSenderCount?: number;
			msgParamSubPlan: SubPlan;
			msgParamSubPlanName: string;
		}
		export interface Message extends BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			goal?: Goal<
				NonNullable<TagsData['msgParamGoalContributionType']>,
				NonNullable<TagsData['msgParamGoalDescription']>,
				NonNullable<TagsData['msgParamGoalCurrentContributions']>,
				NonNullable<TagsData['msgParamGoalTargetContributions']>,
				NonNullable<TagsData['msgParamGoalUserContributions']>
			>;
			message: SystemMessage;
			recipient: SimpleUser<
				TagsData['msgParamRecipientId'],
				TagsData['msgParamRecipientUserName'],
				TagsData['msgParamRecipientDisplayName']
			>;
			subscription: {
				gift: {
					// Number of gifts
					// count: TagsData['msgParamGiftMonths'];
					// Months gifted
					months: TagsData['msgParamGiftMonths'];
				};
				mysteryGift?: {
					id: TagsData['msgParamCommunityGiftId'];
					theme: TagsData['msgParamGiftTheme'];
					// Lifetime; undefined for AnAnonymousGifter
					userTotal: TagsData['msgParamSenderCount'];
				};
				plan: SubscriptionPlanFull;
			};
			user: UserMaybeAnonymous<TagsData>;
		}
	}

	// giftpaidupgrade
	// `${string} is continuing the Gift Sub they got from ${string}!`
	// TODO: get example of upgrading a gift sub from an anonymous user
	export namespace MsgId_GiftPaidUpgrade {
		export interface TagsData extends SharedTagsData {
			msgId: 'giftpaidupgrade';
			msgParamSenderLogin: string;
			msgParamSenderName: string;
		}
		export interface Message extends BaseMessage<TagsData> {
			params: [];
		}
	}

	// primepaidupgrade
	// `${string} converted from a Prime sub to a Tier ${number} sub!`
	export namespace MsgId_PrimePaidUpgrade {
		export interface TagsData extends SharedTagsData {
			msgId: 'primepaidupgrade';
			msgParamSubPlan: SubPlan;
		}
	}

	// Combined giftpaidupgrade and primepaidupgrade
	export namespace PaidUpgrade {
		export type TagsData = MsgId_GiftPaidUpgrade.TagsData | MsgId_PrimePaidUpgrade.TagsData;
		export interface Event {
			channel: Channel;
			gifter?: SimpleUser<
				undefined,
				MsgId_GiftPaidUpgrade.TagsData['msgParamSenderLogin'],
				MsgId_GiftPaidUpgrade.TagsData['msgParamSenderName']
			>;
			message: SystemMessage;
			subscription?: {
				plan: SubscriptionPlanNoName;
			};
			type: 'gift' | 'prime';
			user: User;
		}
	}

	// standardpayforward
	// `${string} is paying forward the Gift they got from ${string} to ${string}!`
	export namespace MsgId_StandardPayForward {
		export interface TagsData extends SharedTagsData {
			msgId: 'standardpayforward';
			msgParamRecipientDisplayName: string;
			msgParamRecipientId: string;
			msgParamRecipientUserName: string;
		}
		export interface Message extends BaseMessage<TagsData> {
			params: [];
		}
	}

	// communitypayforward
	// `${string} is paying forward the Gift they got from ${string} to the community!`
	export namespace MsgId_CommunityPayForward {
		export interface TagsData extends SharedTagsData {
			msgId: 'communitypayforward';
		}
		export interface Message extends BaseMessage<TagsData> {
			params: [];
		}
	}

	// Combine StandardPayForward and CommunityPayForward
	export namespace PayForward {
		interface PayForwardTagsData {
			msgParamPriorGifterAnonymous: boolean;
			msgParamPriorGifterDisplayName: string;
			msgParamPriorGifterId: string;
			msgParamPriorGifterUserName: string;
		}
		export type TagsData = PayForwardTagsData &
			(MsgId_CommunityPayForward.TagsData | MsgId_StandardPayForward.TagsData);
		export interface Message extends BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			message: SystemMessage;
			priorGifter: SimpleUserMaybeAnonymous<
				TagsData['msgParamPriorGifterId'],
				TagsData['msgParamPriorGifterUserName'],
				TagsData['msgParamPriorGifterDisplayName'],
				TagsData['msgParamPriorGifterAnonymous']
			>;
			recipient?: SimpleUser<
				MsgId_StandardPayForward.TagsData['msgParamRecipientId'],
				MsgId_StandardPayForward.TagsData['msgParamRecipientUserName'],
				MsgId_StandardPayForward.TagsData['msgParamRecipientDisplayName']
			>;
			type: 'community' | 'standard';
			user: User;
		}
	}

	// bitsbadgetier
	// `bits badge tier notification`
	export namespace MsgId_BitsBadgeTier {
		export interface TagsData extends SharedTagsData {
			msgId: 'bitsbadgetier';
			// 1000, 25000, etc.
			msgParamThreshold: number;
		}
		export interface Message extends BaseMessage<TagsData> {
			params: [string];
		}
		export interface Event {
			badge: {
				threshold: TagsData['msgParamThreshold'];
			};
			channel: Channel;
			message: UserMessage;
			user: User;
		}
	}

	// announcement
	export namespace MsgId_Announcement {
		export interface TagsData extends SharedTagsData {
			msgId: 'announcement';
			msgParamColor: 'BLUE' | 'GREEN' | 'ORANGE' | 'PRIMARY' | 'PURPLE';
			systemMsg: '';
		}
		export interface Message extends BaseMessage<TagsData> {
			params: [string];
		}
		export interface Event {
			announcement: {
				color: TagsData['msgParamColor'];
			};
			channel: Channel;
			message: UserMessage;
			user: User;
		}
	}

	// raid
	// `${number} raiders from ${string} have joined!`
	export namespace MsgId_Raid {
		export interface TagsData extends SharedTagsData {
			msgId: 'raid';
			// Duplicate data. Same as the user of the message.
			msgParamDisplayName: string;
			// Duplicate data. Same as the user of the message.
			msgParamLogin: string;
			// Has "%s" in the string for the resolution of the image ("300x300", "600x600", etc.)
			msgParamProfileImageUrl: string;
			msgParamViewerCount: number;
		}
		export interface Message extends BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			message: SystemMessage;
			raid: {
				/* Generate the profile image URL for the given size. */
				getProfileImageURL(size?: 28 | 50 | 70 | 150 | 300 | 600): string;
				/* Replace "%s" with the resolution of the image ("300x300", "600x600", etc.) */
				profileImageURL: TagsData['msgParamProfileImageUrl'];
				viewerCount: TagsData['msgParamViewerCount'];
			};
			user: User;
		}
	}

	// unraid
	// `The raid has been canceled.`
	export namespace MsgId_Unraid {
		export interface TagsData extends SharedTagsData {}
		export interface Message extends BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			message: SystemMessage;
			user: User;
		}
	}

	// viewermilestone
	// `${string} watched ${number} consecutive streams this month and sparked a watch streak!`
	export namespace MsgId_ViewerMilestone {
		export interface TagsData extends SharedTagsData {
			msgId: 'viewermilestone';
			// This may not be the only value
			msgParamCategory: 'watch-streak'; // | '???';
			// TODO: What does this UUID represent?
			msgParamId: string;
			// Probably a number, but could be a string for other categories
			// For watch-streak it's a number, like: 3, 5, 7, 10, 15, ..., 65, 70
			msgParamValue: number;
		}
		export interface Message extends BaseMessage<TagsData> {
			params: string[];
		}
		export interface Event {
			channel: Channel;
			message: UserMessage;
			milestone: {
				category: TagsData['msgParamCategory'];
				id: TagsData['msgParamId'];
				value: TagsData['msgParamValue'];
			};
			user: User;
		}
	}
}
