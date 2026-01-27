import { BaseEntity } from "../Entity";

/**class LockState(StrEnum):
    """State of lock entities."""

    JAMMED = "jammed"
    OPENING = "opening"
    LOCKING = "locking"
    OPEN = "open"
    UNLOCKING = "unlocking"
    LOCKED = "locked"
    UNLOCKED = "unlocked"
 */

export const LockStates = {
	JAMMED: "jammed",
	OPENING: "opening",
	LOCKING: "locking",
	OPEN: "open",
	UNLOCKING: "unlocking",
	LOCKED: "locked",
	UNLOCKED: "unlocked",
};

export type LockState = (typeof LockStates)[keyof typeof LockStates];

export const LockFeatures = {
	OPEN: 1,
};

export type LockFeature = (typeof LockFeatures)[keyof typeof LockFeatures];

export class Lock extends BaseEntity<LockState> {
	isFeatureSupported(feature: LockFeature) {
		return super.isFeatureSupported(feature);
	}

	lock() {
		return this.callAction("lock");
	}

	unlock() {
		return this.callAction("unlock");
	}

	open() {
		if (this.isFeatureSupported(LockFeatures.OPEN))
			return this.callAction("open");
	}
}
