/**
 * class CoverState(StrEnum):
    """State of Cover entities."""

    CLOSED = "closed"
    CLOSING = "closing"
    OPEN = "open"
    OPENING = "opening"


class CoverDeviceClass(StrEnum):
    """Device class for cover."""

    # Refer to the cover dev docs for device class descriptions
    AWNING = "awning"
    BLIND = "blind"
    CURTAIN = "curtain"
    DAMPER = "damper"
    DOOR = "door"
    GARAGE = "garage"
    GATE = "gate"
    SHADE = "shade"
    SHUTTER = "shutter"
    WINDOW = "window"

class CoverEntityFeature(IntFlag):
    """Supported features of the cover entity."""

    OPEN = 1
    CLOSE = 2
    SET_POSITION = 4
    STOP = 8
    OPEN_TILT = 16
    CLOSE_TILT = 32
    STOP_TILT = 64
    SET_TILT_POSITION = 128
 */

import { Entity } from "..";

export const CoverStates = {
	CLOSED: "closed",
	CLOSING: "closing",
	OPEN: "open",
	OPENING: "opening",
} as const;

export type CoverState = (typeof CoverStates)[keyof typeof CoverStates];

export const CoverDeviceClass = {
	AWNING: "awning",
	BLIND: "blind",
	CURTAIN: "curtain",
	DAMPER: "damper",
	DOOR: "door",
	GARAGE: "garage",
	GATE: "gate",
	SHADE: "shade",
	SHUTTER: "shutter",
	WINDOW: "window",
} as const;

export type CoverDeviceClass =
	(typeof CoverDeviceClass)[keyof typeof CoverDeviceClass];

export const CoverFeatures = {
	OPEN: 1,
	CLOSE: 2,
	SET_POSITION: 4,
	STOP: 8,
	OPEN_TILT: 16,
	CLOSE_TILT: 32,
	STOP_TILT: 64,
	SET_TILT_POSITION: 128,
} as const;

export type CoverFeature = (typeof CoverFeatures)[keyof typeof CoverFeatures];

export class Cover extends Entity<number> {
	static readonly domain = "cover" as const;

	get position(): number | undefined {
		return this.rawEntity.attributes.current_position as number | undefined;
	}

	get tiltPosition(): number | undefined {
		return this.rawEntity.attributes.current_tilt_position as
			| number
			| undefined;
	}

	isFeatureSupported(feature: CoverFeature): boolean {
		return super._isFeatureSupported(feature);
	}

	setPosition(position: number) {
		return this.callAction("set_cover_position", { position });
	}

	setTiltPosition(tiltPosition: number) {
		return this.callAction("set_cover_tilt_position", {
			tilt_position: tiltPosition,
		});
	}

	close() {
		return this.setPosition(0);
	}

	open() {
		return this.setPosition(100);
	}
}
