export const enum ETagFuncName {
	STRING = 'string',
	NUMBER = 'number',
	LITERAL_BOOLEAN = 'literalBoolean',
	BOOLEAN_NUMBER = 'booleanNumber',
	BADGES = 'badges',
	EMOTES = 'emotes',
	FOLLOWERS_ONLY = 'followersOnly',
	SLOW = 'slow',
	FLAGS = 'flags',
	THREAD_ID = 'threadId',
	COMMA_SEPARATED_STRINGS = 'commaSeparatedStrings',
}

export const _parseTagsMapData: Record<string, [ string, ETagFuncName ]> = {
	'badge-info': [
		'badgeInfo',
		ETagFuncName.BADGES
	],
	'badges': [
		'badges',
		ETagFuncName.BADGES
	],
	'ban-duration': [
		'banDuration',
		ETagFuncName.NUMBER
	],
	'bits': [
		'bits',
		ETagFuncName.NUMBER
	],
	'client-nonce': [
		'clientNonce',
		ETagFuncName.STRING
	],
	'color': [
		'color',
		ETagFuncName.STRING
	],
	'custom-reward-id': [
		'customRewardId',
		ETagFuncName.STRING
	],
	'display-name': [
		'displayName',
		ETagFuncName.STRING
	],
	'emote-only': [
		'emoteOnly',
		ETagFuncName.BOOLEAN_NUMBER
	],
	'emote-sets': [
		'emoteSets',
		ETagFuncName.COMMA_SEPARATED_STRINGS
	],
	'emotes': [
		'emotes',
		ETagFuncName.EMOTES
	],
	'first-msg': [
		'firstMsg',
		ETagFuncName.BOOLEAN_NUMBER
	],
	'flags': [
		'flags',
		ETagFuncName.FLAGS
	],
	'followers-only': [
		'followersOnly',
		ETagFuncName.FOLLOWERS_ONLY
	],
	'id': [
		'id',
		ETagFuncName.STRING
	],
	'login': [
		'login',
		ETagFuncName.STRING
	],
	'message-id': [
		'messageId',
		ETagFuncName.STRING
	],
	'mod': [
		'mod',
		ETagFuncName.LITERAL_BOOLEAN
	],
	'msg-id': [
		'msgId',
		ETagFuncName.STRING
	],
	'msg-param-anon-gift': [
		'msgParamAnonGift',
		ETagFuncName.LITERAL_BOOLEAN
	],
	// 'watch-streak'
	'msg-param-category': [
		'msgParamCategory',
		ETagFuncName.STRING
	],
	// "PRIMARY", "GREEN", "BLUE", "ORANGE", "PURPLE"
	'msg-param-color': [
		'msgParamColor',
		ETagFuncName.STRING
	],
	'msg-param-community-gift-id': [
		'msgParamCommunityGiftId',
		ETagFuncName.STRING
	],
	// "350" -> 350
	'msg-param-copoReward': [
		'msgParamCopoReward',
		ETagFuncName.NUMBER
	],
	'msg-param-cumulative-months': [
		'msgParamCumulativeMonths',
		ETagFuncName.NUMBER
	],
	'msg-param-displayName': [
		'msgParamDisplayName',
		ETagFuncName.STRING
	],
	'msg-param-fun-string': [
		'msgParamFunString',
		ETagFuncName.STRING
	],
	'msg-param-gift-month-being-redeemed': [
		'msgParamGiftMonthBeingRedeemed',
		ETagFuncName.NUMBER
	],
	'msg-param-gift-months': [
		'msgParamGiftMonths',
		ETagFuncName.NUMBER
	],
	// 'showlove' | 'party' | 'lul' | 'biblethump'
	'msg-param-gift-theme': [
		'msgParamGiftTheme',
		ETagFuncName.STRING
	],
	'msg-param-gifter-id': [
		'msgParamGifterId',
		ETagFuncName.STRING
	],
	'msg-param-gifter-login': [
		'msgParamGifterLogin',
		ETagFuncName.STRING
	],
	// Display name
	'msg-param-gifter-name': [
		'msgParamGifterName',
		ETagFuncName.STRING
	],
	// 'SUBS' | 'SUB_POINTS' | ??? (https://dev.twitch.tv/docs/api/reference/#get-creator-goals)
	'msg-param-goal-contribution-type': [
		'msgParamGoalContributionType',
		ETagFuncName.STRING
	],
	'msg-param-goal-current-contributions': [
		'msgParamGoalCurrentContributions',
		ETagFuncName.NUMBER
	],
	'msg-param-goal-description': [
		'msgParamGoalDescription',
		ETagFuncName.STRING
	],
	'msg-param-goal-target-contributions': [
		'msgParamGoalTargetContributions',
		ETagFuncName.NUMBER
	],
	'msg-param-goal-user-contributions': [
		'msgParamGoalUserContributions',
		ETagFuncName.NUMBER
	],
	// UUID string
	'msg-param-id': [
		'msgParamId',
		ETagFuncName.STRING
	],
	'msg-param-login': [
		'msgParamLogin',
		ETagFuncName.STRING
	],
	'msg-param-mass-gift-count': [
		'msgParamMassGiftCount',
		ETagFuncName.NUMBER
	],
	'msg-param-months': [
		'msgParamMonths',
		ETagFuncName.NUMBER
	],
	'msg-param-multimonth-duration': [
		'msgParamMultimonthDuration',
		ETagFuncName.NUMBER
	],
	'msg-param-multimonth-tenure': [
		'msgParamMultimonthTenure',
		ETagFuncName.NUMBER
	],
	'msg-param-origin-id': [
		'msgParamOriginId',
		ETagFuncName.STRING
	],
	// 'true'/'false'
	'msg-param-prior-gifter-anonymous': [
		'msgParamPriorGifterAnonymous',
		ETagFuncName.LITERAL_BOOLEAN
	],
	'msg-param-prior-gifter-display-name': [
		'msgParamPriorGifterDisplayName',
		ETagFuncName.STRING
	],
	'msg-param-prior-gifter-id': [
		'msgParamPriorGifterId',
		ETagFuncName.STRING
	],
	'msg-param-prior-gifter-user-name': [
		'msgParamPriorGifterUserName',
		ETagFuncName.STRING
	],
	// -profile_image-70x70.png
	'msg-param-profileImageURL': [
		'msgParamProfileImageUrl',
		ETagFuncName.STRING
	],
	'msg-param-recipient-display-name': [
		'msgParamRecipientDisplayName',
		ETagFuncName.STRING
	],
	'msg-param-recipient-id': [
		'msgParamRecipientId',
		ETagFuncName.STRING
	],
	'msg-param-recipient-user-name': [
		'msgParamRecipientUserName',
		ETagFuncName.STRING
	],
	'msg-param-sender-count': [
		'msgParamSenderCount',
		ETagFuncName.NUMBER
	],
	'msg-param-sender-login': [
		'msgParamSenderLogin',
		ETagFuncName.STRING
	],
	'msg-param-sender-name': [
		'msgParamSenderName',
		ETagFuncName.STRING
	],
	'msg-param-should-share-streak': [
		'msgParamShouldShareStreak',
		ETagFuncName.BOOLEAN_NUMBER
	],
	'msg-param-streak-months': [
		'msgParamStreakMonths',
		ETagFuncName.NUMBER
	],
	'msg-param-sub-plan-name': [
		'msgParamSubPlanName',
		ETagFuncName.STRING
	],
	// '1000', '2000', '3000', or 'Prime'
	'msg-param-sub-plan': [
		'msgParamSubPlan',
		ETagFuncName.STRING
	],
	// TODO: Check if this value is always a number.
	// USERNOTICE with msgid=bitsbadgetier uses it as a number.
	'msg-param-threshold': [
		'msgParamThreshold',
		ETagFuncName.NUMBER
	],
	'msg-param-value': [
		'msgParamValue',
		ETagFuncName.NUMBER
	],
	'msg-param-viewerCount': [
		'msgParamViewerCount',
		ETagFuncName.NUMBER
	],
	// 'true'/'false'
	'msg-param-was-gifted': [
		'msgParamWasGifted',
		ETagFuncName.LITERAL_BOOLEAN
	],
	'pinned-chat-paid-amount': [
		'pinnedChatPaidAmount',
		ETagFuncName.NUMBER
	],
	'pinned-chat-paid-canonical-amount': [
		'pinnedChatPaidCanonicalAmount',
		ETagFuncName.NUMBER
	],
	'pinned-chat-paid-currency': [
		'pinnedChatPaidCurrency',
		ETagFuncName.STRING
	],
	'pinned-chat-paid-exponent': [
		'pinnedChatPaidExponent',
		ETagFuncName.NUMBER
	],
	// 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN' | 'EIGHT' | 'NINE' | 'TEN'
	'pinned-chat-paid-level': [
		'pinnedChatPaidLevel',
		ETagFuncName.STRING
	],
	'pinned-chat-paid-is-system-message': [
		'pinnedChatPaidIsSystemMessage',
		ETagFuncName.BOOLEAN_NUMBER
	],
	'r9k': [
		'r9k',
		ETagFuncName.BOOLEAN_NUMBER
	],
	'reply-parent-display-name': [
		'replyParentDisplayName',
		ETagFuncName.STRING
	],
	'reply-parent-msg-body': [
		'replyParentMsgBody',
		ETagFuncName.STRING
	],
	'reply-parent-msg-id': [
		'replyParentMsgId',
		ETagFuncName.STRING
	],
	'reply-parent-user-id': [
		'replyParentUserId',
		ETagFuncName.STRING
	],
	'reply-parent-user-login': [
		'replyParentUserLogin',
		ETagFuncName.STRING
	],
	'reply-thread-parent-display-name': [
		'replyThreadParentDisplayName',
		ETagFuncName.STRING
	],
	'reply-thread-parent-msg-id': [
		'replyThreadParentMsgId',
		ETagFuncName.STRING
	],
	'reply-thread-parent-user-id': [
		'replyThreadParentUserId',
		ETagFuncName.STRING
	],
	'reply-thread-parent-user-login': [
		'replyThreadParentUserLogin',
		ETagFuncName.STRING
	],
	'returning-chatter': [
		'returningChatter',
		ETagFuncName.BOOLEAN_NUMBER
	],
	'room-id': [
		'roomId',
		ETagFuncName.STRING
	],
	'slow': [
		'slow',
		ETagFuncName.SLOW
	],
	'subs-only': [
		'subsOnly',
		ETagFuncName.BOOLEAN_NUMBER
	],
	'subscriber': [
		'subscriber',
		ETagFuncName.BOOLEAN_NUMBER
	],
	'system-msg': [
		'systemMsg',
		ETagFuncName.STRING
	],
	'target-msg-id': [
		'targetMsgId',
		ETagFuncName.STRING
	],
	'target-user-id': [
		'targetUserId',
		ETagFuncName.STRING
	],
	'thread-id': [
		'threadId',
		ETagFuncName.THREAD_ID
	],
	'tmi-sent-ts': [
		'tmiSentTs',
		ETagFuncName.NUMBER
	],
	'turbo': [
		'turbo',
		ETagFuncName.BOOLEAN_NUMBER
	],
	'user-id': [
		'userId',
		ETagFuncName.STRING
	],
	'user-type': [
		'userType',
		ETagFuncName.STRING
	],
	'vip': [
		'vip',
		ETagFuncName.BOOLEAN_NUMBER
	]
};