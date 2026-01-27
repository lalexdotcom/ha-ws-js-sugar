export const States = {
	ON: "on",
	OFF: "off",
	HOME: "home",
	NOT_HOME: "not_home",
	UNKNOWN: "unknown",
	OPEN: "open",
	OPENING: "opening",
	CLOSED: "closed",
	CLOSING: "closing",
	BUFFERING: "buffering",
	PLAYING: "playing",
	PAUSED: "paused",
	IDLE: "idle",
	STANDBY: "standby",
	UNAVAILABLE: "unavailable",
	OK: "ok",
	PROBLEM: "problem",
} as const;

export namespace States {
	export type ON = typeof States.ON;
	export type OFF = typeof States.OFF;
	export type HOME = typeof States.HOME;
	export type NOT_HOME = typeof States.NOT_HOME;
	export type UNKNOWN = typeof States.UNKNOWN;
	export type OPEN = typeof States.OPEN;
	export type OPENING = typeof States.OPENING;
	export type CLOSED = typeof States.CLOSED;
	export type CLOSING = typeof States.CLOSING;
	export type BUFFERING = typeof States.BUFFERING;
	export type PLAYING = typeof States.PLAYING;
	export type PAUSED = typeof States.PAUSED;
	export type IDLE = typeof States.IDLE;
	export type STANDBY = typeof States.STANDBY;
	export type UNAVAILABLE = typeof States.UNAVAILABLE;
	export type OK = typeof States.OK;
	export type PROBLEM = typeof States.PROBLEM;
}

export type State = (typeof States)[keyof typeof States];
/*
STATE_ON: Final = "on"
STATE_OFF: Final = "off"
STATE_HOME: Final = "home"
STATE_NOT_HOME: Final = "not_home"
STATE_UNKNOWN: Final = "unknown"
STATE_OPEN: Final = "open"
STATE_OPENING: Final = "opening"
STATE_CLOSED: Final = "closed"
STATE_CLOSING: Final = "closing"
STATE_BUFFERING: Final = "buffering"
STATE_PLAYING: Final = "playing"
STATE_PAUSED: Final = "paused"
STATE_IDLE: Final = "idle"
STATE_STANDBY: Final = "standby"
STATE_UNAVAILABLE: Final = "unavailable"
STATE_OK: Final = "ok"
STATE_PROBLEM: Final = "problem" */
