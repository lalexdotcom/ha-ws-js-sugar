import type { HassEntity } from "home-assistant-js-websocket";
import type { States } from "../../../const";
import { Entity } from "../Entity";

export const ClimateHVACModes = {
	OFF: "off",
	HEAT: "heat",
	COOL: "cool",
	HEAT_COOL: "heat_cool",
	AUTO: "auto",
	FAN_ONLY: "fan_only",
} as const;

export type ClimateHVACMode =
	(typeof ClimateHVACModes)[keyof typeof ClimateHVACModes];

export const ClimateHVACStates = {
	COOLING: "cooling",
	DEFROSTING: "defrosting",
	DRYING: "drying",
	FAN: "fan",
	HEATING: "heating",
	IDLE: "idle",
	OFF: "off",
	PREHEATING: "preheating",
} as const;

export type ClimateHVACState =
	(typeof ClimateHVACStates)[keyof typeof ClimateHVACStates];

export const ClimateFeatures = {
	TARGET_TEMPERATURE: 1,
	TARGET_TEMPERATURE_RANGE: 2,
	TARGET_HUMIDITY: 4,
	FAN_MODE: 8,
	PRESET_MODE: 16,
	SWING_MODE: 32,
	TURN_OFF: 128,
	TURN_ON: 256,
	SWING_HORIZONTAL_MODE: 512,
} as const;

export type ClimateFeature =
	(typeof ClimateFeatures)[keyof typeof ClimateFeatures];

const ClimatePresetModes = {
	NONE: "none",
	ECO: "eco",
	AWAY: "away",
	BOOST: "boost",
	COMFORT: "comfort",
	HOME: "home",
	SLEEP: "sleep",
	ACTIVITY: "activity",
} as const;

export type ClimatePresetMode =
	| (typeof ClimatePresetModes)[keyof typeof ClimatePresetModes]
	| (string & {});

export const ClimateFanModes = {
	ON: "on",
	OFF: "off",
	AUTO: "auto",
	LOW: "low",
	MEDIUM: "medium",
	HIGH: "high",
	TOP: "top",
	MIDDLE: "middle",
	FOCUS: "focus",
	DIFFUSE: "diffuse",
} as const;

export type ClimateFanMode =
	(typeof ClimateFanModes)[keyof typeof ClimateFanModes];

export const ClimateSwingModes = {
	ON: "on",
	OFF: "off",
	BOTH: "both",
	VERTICAL: "vertical",
	HORIZONTAL: "horizontal",
} as const;

export type ClimateSwingMode =
	(typeof ClimateSwingModes)[keyof typeof ClimateSwingModes];

export class Climate extends Entity<ClimateHVACState, ClimateFeature> {
	protected parseState(entity: HassEntity): ClimateHVACState {
		return entity.attributes.hvac_action;
	}

	turnOn() {
		return this.callAction("turn_on");
	}

	turnOff() {
		return this.callAction("turn_off");
	}

	toggle() {
		return this.callAction("toggle");
	}

	get mode() {
		return this.rawEntity.state as ClimateHVACMode;
	}

	get modes() {
		return this.rawEntity.attributes.hvac_modes as ClimateHVACMode[];
	}

	setMode(hvac_mode: ClimateHVACMode) {
		return this.callAction("set_hvac_mode", { hvac_mode });
	}

	get currentTemperature(): number | undefined {
		return this.rawEntity.attributes.current_temperature;
	}

	get targetTemperature() {
		return this.mode === ClimateHVACModes.HEAT_COOL
			? ([
					this.rawEntity.attributes.target_temperature_low,
					this.rawEntity.attributes.target_temperature_high,
				] as [number, number])
			: this.mode === ClimateHVACModes.FAN_ONLY
				? undefined
				: (this.rawEntity.attributes.temperature as number);
	}

	setTargetTemperature(
		temperatures: [number, number],
		mode: typeof ClimateHVACModes.HEAT_COOL,
	): Promise<unknown>;
	setTargetTemperature(
		temperature: number,
		mode: Exclude<
			ClimateHVACMode,
			| typeof ClimateHVACModes.HEAT_COOL
			| typeof ClimateHVACModes.FAN_ONLY
			| typeof ClimateHVACModes.OFF
		>,
	): Promise<unknown>;
	setTargetTemperature(
		temperatureOrTemperatures: number | [number, number],
	): Promise<unknown>;
	setTargetTemperature(
		temperature: number | [number, number],
		mode?: ClimateHVACMode,
	) {
		mode ??= this.mode;
		if (mode === ClimateHVACModes.HEAT_COOL) {
			if (Array.isArray(temperature)) {
				return this.callAction("set_temperature", {
					hvac_mode: mode,
					target_temp_low: temperature[0],
					target_temp_high: temperature[1],
				});
			} else {
				throw new Error(`Mode ${mode} need [<low>, <high>] temperatures array`);
			}
		} else if (mode === ClimateHVACModes.FAN_ONLY) {
			return this.callAction("set_temperature", { hvac_mode: mode });
		}
		return this.callAction("set_temperature", { hvac_mode: mode, temperature });
	}

	get minTemp() {
		return this.rawEntity.attributes.min_temp as number | undefined;
	}
	get maxTemp() {
		return this.rawEntity.attributes.max_temp as number | undefined;
	}

	get currentHumidity() {
		return this.rawEntity.attributes.current_humidity as number | undefined;
	}

	get targetHumidity() {
		return this.rawEntity.attributes.humidity as number | undefined;
	}

	setTargetHumidity(humidity: number) {
		return this.callAction("set_humidity", { humidity });
	}

	get presetMode() {
		return this.rawEntity.attributes.preset_mode as
			| ClimatePresetMode
			| undefined;
	}

	get presetModes() {
		return (
			(this.rawEntity.attributes.preset_modes as ClimatePresetMode[]) ?? []
		);
	}

	setPresetMode(preset_mode: ClimatePresetMode) {
		if (!this.presetModes.includes(preset_mode))
			throw new Error(`Unknown preset mode ${preset_mode}`);
		return this.callAction("set_preset_mode", { preset_mode });
	}

	get fanMode() {
		return this.rawEntity.attributes.fan_mode as ClimateFanMode | undefined;
	}

	setFanMode(fan_mode: ClimateFanMode) {
		return this.callAction("set_fan_mode", { fan_mode });
	}

	get swingMode() {
		return this.rawEntity.attributes.swing_mode as ClimateSwingMode | undefined;
	}

	setSwingMode(swing_mode: ClimateSwingMode) {
		return this.callAction("set_swing_mode", { swing_mode });
	}

	get horizontalSwingMode() {
		return this.rawEntity.attributes.horizontal_fan_mode as
			| States.ON
			| States.OFF
			| undefined;
	}

	setHorizontalSwingMode(swing_horizontal_mode: States.ON | States.OFF) {
		return this.callAction("set_swing_horizontal_mode", {
			swing_horizontal_mode,
		});
	}
}
