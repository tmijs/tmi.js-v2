// TODO: Add more meaningful descriptions to each level
export enum LogLevel {
	/** Log everything */
	Trace = 0,
	/** Log debug messages and above */
	Debug = 1,
	/** Log verbose messages and above */
	Verbose = 2,
	/** Log info messages and above */
	Info = 3,
	/** Log warning messages and above */
	Warn = 4,
	/** Log error messages and above */
	Error = 5,
	/** Log fatal messages only */
	Fatal = 6,
}

export class Logger {
	static LogLevel: typeof LogLevel = LogLevel;

	private level: number = LogLevel.Error;

	// TODO: Possibly add "@version" to the prefix as part of the build process
	private prefix: string = `tmi.js@${process.env.npm_package_version}`;

	constructor(level?: LogLevel) {
		if(level !== undefined) {
			this.level = level;
		}
	}
	setLevel(level: LogLevel) {
		this.level = level;
	}

	private getTime() {
		const now = new Date();
		const parts = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
		return `[${parts.map(n => n.toString().padStart(2, '0')).join(':')}]`;
	}

	private log(level: LogLevel, ...args: any[]) {
		if(level >= this.level) {
			const timestamp = this.getTime();
			const p = `${timestamp} ${this.prefix} ${LogLevel[level]}:`;
			if(level === LogLevel.Error) {
				console.error(p, ...args);
			}
			else {
				console.log(p, ...args);
			}
		}
	}

	trace(...args: any[]) {
		this.log(LogLevel.Trace, ...args);
	}
	debug(...args: any[]) {
		this.log(LogLevel.Debug, ...args);
	}
	verbose(...args: any[]) {
		this.log(LogLevel.Verbose, ...args);
	}
	info(...args: any[]) {
		this.log(LogLevel.Info, ...args);
	}
	warn(...args: any[]) {
		this.log(LogLevel.Warn, ...args);
	}
	error(...args: any[]) {
		this.log(LogLevel.Error, ...args);
	}
	fatal(...args: any[]) {
		this.log(LogLevel.Fatal, ...args);
	}
}