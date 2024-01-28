import { Channel } from '../Channel';
import { Client } from '../Client';
import { IrcMessage, ChannelString, TagsDataType } from './IrcMessage';
import { EmotesTag, MessageFlag } from './tags';

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
export type SubTier = 1 | 2 | 3;

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
		emoteOnly: boolean;
		/**
		 * Determines whether only followers can post messages in the chat room. The value indicates how long, in
		 * minutes, the user must have followed the broadcaster before posting chat messages. A value of -1 indicates
		 * that this setting is disabled.
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
		 * Determines how long, in seconds, users must wait between sending
		 * messages.
		 */
		slow: number;
		/**
		 * Determines whether only subscribers and moderators can chat in the
		 * chat room.
		 */
		subsOnly: boolean;
	}
	export interface Message extends IrcMessage<'ROOMSTATE', TagsData> {
		channel: ChannelString;
		prefix: PrefixHostOnly;
		params: [];
	}
	export interface Event {
		channel: Channel;
		state: TagsData;
		isInitial: boolean;
		change: Partial<Omit<TagsData, 'roomId'>>;
	}

	export interface IndividualEvent {
		channel: Channel;
		isEnabled: boolean;
	}

	export interface Event_EmoteOnly extends IndividualEvent {
		state: TagsData['emoteOnly'];
	}
	export interface Event_FollowersOnly extends IndividualEvent {
		state: TagsData['followersOnly'];
	}
	export interface Event_UniqueMode extends IndividualEvent {
		state: TagsData['r9k'];
	}
	export interface Event_SlowMode extends IndividualEvent {
		state: TagsData['slow'];
	}
	export interface Event_SubsOnly extends IndividualEvent {
		state: TagsData['subsOnly'];
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

	export interface Message extends IrcMessage<'PRIVMSG', TagsData | TagsData_Reply | TagsData_Cheer | TagsData_Introduction | TagsData_Reward_Custom | TagsData_Reward_Highlighted | TagsData_Reward_SkipSubsMode | TagsData_AutomodAccepted> {
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
		flags: MessageFlag[];
		id: string;
		login: string;
		mod: boolean;
		roomId: string;
		subscriber: boolean;
		tmiSentTs: number;
		userId: string;
		userType: UserType;
		systemMsg: string;
	}
	export interface SimpleUser<ID = string, Name = string, DisplayName = string> {
		id: ID;
		name: Name;
		displayName: DisplayName;
	}
	export interface SimpleUserMaybeAnonymous<ID = string, Name = string, DisplayName = string> extends SimpleUser<ID, Name, DisplayName> {
		isAnonymous: boolean;
	}
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
	export type UserMaybeAnonymous<TagsData extends SharedTagsData = SharedTagsData> = User<TagsData> & { isAnonymous: boolean; };
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
		text: string;
		emotes: SharedTagsData['emotes'];
		flags: SharedTagsData['flags'];
	}
	export interface SubscriptionPlanFull {
		name: string;
		plan: SubPlan;
		tier: SubTier;
		isPrime: boolean;
	};
	export interface SubscriptionPlanNoName {
		name: undefined;
		plan: SubPlan;
		tier: SubTier;
		isPrime: boolean;
	};
	export interface SubscriptionPlanEmpty {
		name: undefined;
		plan: undefined;
		tier: undefined;
		isPrime: boolean;
	};
	export interface BaseMessage<TagsData extends TagsDataType> extends IrcMessage<'USERNOTICE', TagsData> {
		channel: ChannelString;
		prefix: PrefixHostOnly;
	}
	export interface Message extends BaseMessage<SharedTagsData> {
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
			msgParamSubPlanName: string;
			msgParamSubPlan: SubPlan;
			msgParamWasGifted: false; // Always false
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [ string ];
		}
		export interface Event {
			channel: Channel;
			user: User;
			message: SystemMessage;
			subscription: {
				plan: SubscriptionPlanFull;
				multiMonth: {
					duration: TagsData['msgParamMultimonthDuration'];
				};
			};
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
			user: User;
			message: UserMessage;
			subscription: {
				cumulativeMonths: TagsData['msgParamCumulativeMonths'];
				plan: SubscriptionPlanFull;
				multiMonth: {
					duration: TagsData['msgParamMultimonthDuration'];
					tenure: TagsData['msgParamMultimonthTenure'];
				};
				streak?: {
					months: NonNullable<TagsData['msgParamStreakMonths']>;
				}
				gift?: {
					gifter: {
						id: NonNullable<TagsData['msgParamGifterId']>;
						name: NonNullable<TagsData['msgParamGifterLogin']>;
						displayName: NonNullable<TagsData['msgParamGifterName']>;
						isAnonymous: NonNullable<TagsData['msgParamAnonGift']>;
					};
					// User is at month monthBeingRedeemed (1, 2, 3, ..., 11, 12) out of msgParamGiftMonths (3, 6, 12) months
					// Value can be 0 (at least in two cases of anonymous gifts, streak both ways. Two non-anonymous gifts had non-zero values)
					monthBeingRedeemed: NonNullable<TagsData['msgParamGiftMonthBeingRedeemed']>;
					months: NonNullable<TagsData['msgParamGiftMonths']>;
				};
			};
		}
	}

	type GoalContributionType = 'SUB_POINTS' | 'SUBS' | 'NEW_SUB_POINTS' | 'NEW_SUBS';

	// submysterygift
	// `${string} is gifting ${number} Tier ${number} Subs to ${string}'s community! They've gifted a total of ${number} in the channel!`,
	// `${string} is gifting ${number} Tier ${number} Subs to ${string}'s community!`,
	// `An anonymous user is gifting ${number} Tier ${number} Subs to ${string}'s community!`
	export namespace MsgId_SubMysteryGift {
		export interface TagsData extends SharedTagsData {
			msgId: 'submysterygift';
			msgParamCommunityGiftId: string;
			// These may not be the only values
			msgParamGiftTheme: 'showlove' | 'party' | 'lul' | 'biblethump';
			// https://dev.twitch.tv/docs/api/reference/#get-creator-goals
			// The Helix API lists 5 types. 4 of them being sub related.
			// "subscription", "subscription_count", "new_subscription", "new_subscription_count"
			msgParamGoalContributionType?: GoalContributionType;
			msgParamGoalCurrentContributions?: number;
			// Description may be omitted if it would be otherwise empty. (User set value)
			msgParamGoalDescription?: string;
			msgParamGoalTargetContributions?: number;
			msgParamGoalUserContributions?: number;
			msgParamMassGiftCount: number;
			msgParamOriginId: string;
			// May be ommited if the user is anonymous
			msgParamSenderCount: number;
			// There is no msgParamSubPlanName for submysterygift
			// msgParamSubPlanName: string;
			msgParamSubPlan: SubPlan;
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			user: UserMaybeAnonymous;
			message: SystemMessage;
			subscription: {
				plan: SubscriptionPlanNoName;
				mysteryGift: {
					id: TagsData['msgParamCommunityGiftId'];
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
			msgParamGiftTheme?: string; // 'showlove', 'party', 'lul', 'biblethump'
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
			msgParamSubPlanName: string;
			msgParamSubPlan: SubPlan;
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			user: UserMaybeAnonymous<TagsData>;
			message: SystemMessage;
			recipient: SimpleUser<
				TagsData['msgParamRecipientId'],
				TagsData['msgParamRecipientUserName'],
				TagsData['msgParamRecipientDisplayName']
			>;
			subscription: {
				plan: SubscriptionPlanFull;
				mysteryGift?: {
					id: TagsData['msgParamCommunityGiftId'];
					// Lifetime; undefined for AnAnonymousGifter
					userTotal: TagsData['msgParamSenderCount'];
				};
				gift: {
					// Number of gifts
					// count: TagsData['msgParamGiftMonths'];
					// Months gifted
					months: TagsData['msgParamGiftMonths'];
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

	// giftpaidupgrade
	// `${string} is continuing the Gift Sub they got from ${string}!`
	// TODO: get example of upgrading a gift sub from an anonymous user
	export namespace MsgId_GiftPaidUpgrade {
		export interface TagsData extends SharedTagsData {
			msgId: 'giftpaidupgrade';
			msgParamSenderLogin: string;
			msgParamSenderName: string;
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
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
			user: User;
			message: SystemMessage;
			type: 'gift' | 'prime';
			gifter?: SimpleUser<
				undefined,
				MsgId_GiftPaidUpgrade.TagsData['msgParamSenderLogin'],
				MsgId_GiftPaidUpgrade.TagsData['msgParamSenderName']
			>;
			subscription?: {
				plan: SubscriptionPlanNoName;
			};
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
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [];
		}
	}

	// communitypayforward
	// `${string} is paying forward the Gift they got from ${string} to the community!`
	export namespace MsgId_CommunityPayForward {
		export interface TagsData extends SharedTagsData {
			msgId: 'communitypayforward';
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
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
		export type TagsData = (MsgId_StandardPayForward.TagsData | MsgId_CommunityPayForward.TagsData) & PayForwardTagsData;
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			user: User;
			message: SystemMessage;
			type: 'standard' | 'community';
			priorGifter: SimpleUserMaybeAnonymous<
				TagsData['msgParamPriorGifterId'],
				TagsData['msgParamPriorGifterUserName'],
				TagsData['msgParamPriorGifterDisplayName']
			>;
			recipient?: SimpleUser<
				MsgId_StandardPayForward.TagsData['msgParamRecipientId'],
				MsgId_StandardPayForward.TagsData['msgParamRecipientUserName'],
				MsgId_StandardPayForward.TagsData['msgParamRecipientDisplayName']
			>;
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
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [ string ];
		}
		export interface Event {
			channel: Channel;
			user: User;
			message: UserMessage;
			badge: {
				threshold: TagsData['msgParamThreshold'];
			};
		}
	}

	// announcement
	export namespace MsgId_Announcement {
		export interface TagsData extends SharedTagsData {
			msgId: 'announcement';
			msgParamColor: 'PRIMARY' | 'ORANGE' | 'GREEN' | 'BLUE' | 'PURPLE';
			systemMsg: '';
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [ string ];
		}
		export interface Event {
			channel: Channel;
			user: User;
			message: UserMessage;
			announcement: {
				color: TagsData['msgParamColor'];
			};
		}
	}

	// raid
	// `${number} raiders from ${string} have joined!"
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
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			user: User;
			message: SystemMessage;
			raid: {
				viewerCount: TagsData['msgParamViewerCount'];
				/** Replace "%s" with the resolution of the image ("300x300", "600x600", etc.) */
				profileImageURL: TagsData['msgParamProfileImageUrl'];
				/** Generate the profile image URL for the given size. */
				getProfileImageURL: (size: 28 | 50 | 70 | 150 | 300 | 600) => string;
			};
		}
	}

	// unraid
	// The raid has been canceled.
	export namespace MsgId_Unraid {
		export interface TagsData extends SharedTagsData {
		}
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: [];
		}
		export interface Event {
			channel: Channel;
			user: User;
			message: SystemMessage;
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
		export interface Message extends USERNOTICE.BaseMessage<TagsData> {
			params: string[];
		}
		export interface Event {
			channel: Channel;
			user: User;
			message: UserMessage;
			milestone: {
				category: TagsData['msgParamCategory'];
				id: TagsData['msgParamId'];
				value: TagsData['msgParamValue'];
			};
		}
	}
}
