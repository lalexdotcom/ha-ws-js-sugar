import type { HassEntity } from "home-assistant-js-websocket";
import { Entity } from "..";
import { Sensor } from "./Sensor";

export const InputNumberModes = {
	SLIDER: "slider",
	BOX: "box",
};

type InputNumberMode = (typeof InputNumberModes)[keyof typeof InputNumberModes];

export class InputNumber extends Entity<number> {
	static readonly domain = "input_number" as const;

	get minValue() {
		return this.rawEntity.attributes.native_min_value as number;
	}

	get maxValue() {
		return this.rawEntity.attributes.native_max_value as number;
	}

	get step() {
		return this.rawEntity.attributes.native_step as number;
	}

	get mode() {
		return this.rawEntity.attributes.mode as InputNumberMode;
	}

	protected parseState(entity: HassEntity): number {
		return Number.parseFloat(entity.state);
	}

	increment() {
		this.callAction("increment");
	}

	decrement() {
		this.callAction("decrement");
	}

	setValue(value: number) {
		this.callAction("set_value", { value });
	}

	reload() {
		this.callAction("reload");
	}
}
