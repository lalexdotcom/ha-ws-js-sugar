import { parseJSON } from "date-fns";
import type { HassEntity } from "home-assistant-js-websocket";
import { Entity } from "..";

export const AlarmStates = {
	DISARMED: "disarmed",
	ARMED_HOME: "armed_home",
	ARMED_AWAY: "armed_away",
	ARMED_NIGHT: "armed_night",
	ARMED_VACATION: "armed_vacation",
	ARMED_CUSTOM_BYPASS: "armed_custom_bypass",
	PENDING: "pending",
	ARMING: "arming",
	DISARMING: "disarming",
	TRIGGERED: "triggered",
} as const;

export type AlarmState = (typeof AlarmStates)[keyof typeof AlarmStates];

export const AlarmFeatures = {
	HOME: 1,
	AWAY: 2,
	NIGHT: 4,
	TRIGGER: 8,
	CUSTOM_BYPASS: 16,
	VACATION: 32,
} as const;

export const AlarmCodeFormats = {
	TEXT: "text",
	NUMBER: "number",
} as const;

export type AlarmCodeFormat =
	(typeof AlarmCodeFormats)[keyof typeof AlarmCodeFormats];

export type AlarmFeature = (typeof AlarmFeatures)[keyof typeof AlarmFeatures];

const ARM_STATE_ACTIONS = {
	[AlarmStates.ARMED_HOME]: "alarm_arm_home",
	[AlarmStates.ARMED_AWAY]: "alarm_arm_away",
	[AlarmStates.ARMED_NIGHT]: "alarm_arm_night",
	[AlarmStates.ARMED_VACATION]: "alarm_arm_vacation",
	[AlarmStates.ARMED_CUSTOM_BYPASS]: "alarm_arm_custom_bypass",
} as const satisfies Partial<Record<AlarmState, string>>;

export class Alarm extends Entity<AlarmState> {
	static readonly domain = "alarm_control_panel" as const;

	readonly lastTriggered?: Date;

	protected parseHassEntity(hassEntity: HassEntity) {
		return {
			lastTriggered: hassEntity.attributes.last_triggered
				? parseJSON(hassEntity.attributes.last_triggered)
				: undefined,
			...super.parseHassEntity(hassEntity),
		};
	}

	isFeatureSupported(feature: AlarmFeature): boolean {
		return super._isFeatureSupported(feature);
	}

	get codeFormat() {
		return this.rawEntity.attributes.code_format as AlarmCodeFormat | undefined;
	}

	isCodeRequired() {
		return this.rawEntity.attributes.arm_code_required ?? true;
	}

	get changedBy() {
		return this.rawEntity.attributes.changed_by as string | undefined;
	}

	trigger(code?: string | number) {
		return this.callAction("alarm_trigger", { code });
	}

	disarm(code?: string | number) {
		return this.callAction("alarm_disarm", { code });
	}

	arm(mode: keyof typeof ARM_STATE_ACTIONS, code?: string | number) {
		const action = ARM_STATE_ACTIONS[mode];
		return this.callAction(action, { code });
	}
}
