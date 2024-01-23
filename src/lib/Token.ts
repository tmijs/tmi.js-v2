interface ValidateTokenBody {
	client_id: string;
	expires_in: number;
	login: string;
	scopes: string[];
	user_id: string;
}

export class Token {
	value?: string;
	clientId?: string;
	scopes?: string[];
	login?: string;
	userId?: string;
	/**
	 * The date when the token expires. If the token will not expire, this is null. These non-expiring tokens could be
	 * set to expire by Twitch at a later date, so issues may arise if you rely on this type of token.
	 */
	expiresAt?: Date | null;
	getter?: (() => Promise<string>);
	constructor(value?: string | (() => Promise<string>)) {
		if(typeof value === 'string') {
			this.value = value;
		}
		else if(typeof value === 'function') {
			this.getter = value;
		}
		else {
			this.value = Token.anonymousIrcToken;
		}
	}
	static anonymousIrcToken: string = 'SCHMOOPIIE';
	[Symbol.for('nodejs.util.inspect.custom')](_depth: number, options: any, inspect: (value: any, options: any) => string) {
		return inspect(<typeof this>{
			value: typeof this.value === 'string' ? '***tmi.js-censored***' : undefined,
			clientId: this.clientId,
			scopes: this.scopes,
			login: this.login,
			userId: this.userId,
			expiresAt: this.expiresAt,
			getter: this.getter,
		}, options);
	}
	get isAnonymous(): boolean {
		return this.value === Token.anonymousIrcToken;
	}
	async getToken() {
		// TODO: Check expiresAt
		if(!this.value) {
			if(this.getter) {
				const value = await this.getter();
				if(!value) {
					throw new Error('Did not get a valid token from the supplied getter function');
				}
				this.value = value;
			}
		}
		return this.value;
	}
	formatIrc(): string {
		const { value } = this;
		if(value === undefined || value === '') {
			throw new Error('No token value, may need to call getToken first');
		}
		else if(typeof value !== 'string') {
			throw new Error('Invalid token type ' + typeof value);
		}
		if(value.startsWith('oauth:') && value.length > 6) {
			return value;
		}
		return `oauth:${value}`;
	}
	async validate() {
		if(!this.value) {
			throw new Error('No token value');
		}
		const res = await fetch('https://id.twitch.tv/oauth2/validate', {
			headers: {
				Authorization: `OAuth ${this.value}`
			}
		});
		if(res.status !== 200) {
			throw new Error(`Failed to validate token: ${res.statusText}`);
		}
		const data: ValidateTokenBody = await res.json();
		this.clientId = data.client_id;
		this.login = data.login;
		this.userId = data.user_id;
		this.scopes = data.scopes;
		this.expiresAt = data.expires_in ? new Date(data.expires_in * 1000 + Date.now()) : null;
	}
	// POST https://id.twitch.tv/oauth2/revoke?${{ token, client_id }}`
	async revoke() {
		throw new Error('Not implemented');
	}
}