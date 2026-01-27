import { States } from "../../../const";
import { BaseEntity } from "../Entity";

export const WaterHeaterModes = {
	OFF: States.OFF,
	ON: States.ON,
	ECO: "eco",
	ELECTRIC: "electric",
	GAS: "gas",
	HEAT_PUMP: "heat_pump",
	HIGH_DEMAND: "high_demand",
	PERFORMANCE: "performance",
} as const;

export type WaterHeaterMode =
	(typeof WaterHeaterModes)[keyof typeof WaterHeaterModes];

/**class WaterHeaterEntityFeature(IntFlag):
    """Supported features of the water heater entity."""

    TARGET_TEMPERATURE = 1
    OPERATION_MODE = 2
    AWAY_MODE = 4
    ON_OFF = 8 */

export const WaterHeaterFeatures = {
	TARGET_TEMPERATURE: 1,
	OPERATION_MODE: 2,
	AWAY_MODE: 4,
	ON_OFF: 8,
} as const;

export type WaterHeaterFeature =
	(typeof WaterHeaterFeatures)[keyof typeof WaterHeaterFeatures];

export class WaterHeater extends BaseEntity<
	WaterHeaterMode,
	WaterHeaterFeature
> {
	get currentTemperature(): number | undefined {
		return this.rawEntity.attributes.current_temperature as number | undefined;
	}
	get targetTemperature(): number | undefined {
		return this.rawEntity.attributes.temperature as number | undefined;
	}
	get minTemp(): number | undefined {
		return this.rawEntity.attributes.min_temp as number | undefined;
	}
	get maxTemp(): number | undefined {
		return this.rawEntity.attributes.max_temp as number | undefined;
	}
	get targetTemperatureStep(): number | undefined {
		return this.rawEntity.attributes.target_temperature_step as
			| number
			| undefined;
	}

	get mode() {
		return this.rawEntity.attributes.operation_mode as
			| WaterHeaterMode
			| (string & {});
	}

	get modes(): string[] | undefined {
		return this.rawEntity.attributes.operation_list as string[] | undefined;
	}

	setMode(mode: WaterHeaterMode | (string & {})) {
		return this.callAction("set_operation_mode", { operation_mode: mode });
	}

	get isAway(): boolean | undefined {
		return this.rawEntity.attributes.away_mode === States.ON;
	}

	setAway(away: boolean) {
		return this.callAction("set_away_mode", {
			away_mode: away ? States.ON : States.OFF,
		});
	}

	setTemperature(
		temperature: number,
		operation_mode?: WaterHeaterMode | (string & {}),
	) {
		const actionParams: Record<string, unknown> = { temperature };
		if (operation_mode) {
			actionParams.operation_mode = operation_mode;
		}
		return this.callAction("set_temperature", actionParams);
	}

	turnOn() {
		return this.callAction("turn_on");
	}

	turnOff() {
		return this.callAction("turn_off");
	}
}
