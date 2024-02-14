// TODO: Add more meaningful descriptions to each level
export enum LogLevel {
	/* Log everything */
	Trace = 0,
	/* Log debug messages and above */
	Debug = 1,
	/* Log verbose messages and above */
	Verbose = 2,
	/* Log info messages and above */
	Info = 3,
	/* Log warning messages and above */
	Warn = 4,
	/* Log error messages and above */
	Error = 5,
	/* Log fatal messages only */
	Fatal = 6,
}

export class Logger {
	public static LogLevel: typeof LogLevel = LogLevel;

	private level: number = LogLevel.Error;

	private prefix: string = `tmi.js@[VI]{{inject}}[/VI]`;

	public constructor(level?: LogLevel) {
		if (level !== undefined) {
			this.setLevel(level);
		}
	}

	public getLevel() {
		return this.level;
	}

	public setLevel(level: LogLevel) {
		this.level = level;
	}

	private getTime() {
		const now = new Date();
		const parts = [now.getHours(), now.getMinutes(), now.getSeconds()];
		return `[${parts.map((num) => num.toString().padStart(2, '0')).join(':')}]`;
	}

	private log(level: LogLevel, ...args: any[]) {
		if (level >= this.level) {
			const timestamp = this.getTime();
			const prefix = `${timestamp} ${this.prefix} ${LogLevel[level]}:`;
			if (level === LogLevel.Error) {
				console.error(prefix, ...args);
			} else {
				console.log(prefix, ...args);
			}
		}
	}

	public trace(...args: any[]) {
		this.log(LogLevel.Trace, ...args);
	}

	public debug(...args: any[]) {
		this.log(LogLevel.Debug, ...args);
	}

	public verbose(...args: any[]) {
		this.log(LogLevel.Verbose, ...args);
	}

	public info(...args: any[]) {
		this.log(LogLevel.Info, ...args);
	}

	public warn(...args: any[]) {
		this.log(LogLevel.Warn, ...args);
	}

	public error(...args: any[]) {
		this.log(LogLevel.Error, ...args);
	}

	public fatal(...args: any[]) {
		this.log(LogLevel.Fatal, ...args);
	}
}
