import { parseJSON } from "date-fns";
import type { HassEntity } from "home-assistant-js-websocket";
import { BaseEntity } from "../Entity";

export const ButtonDeviceClass = {
	IDENTIFY: "identify",
	RESTART: "restart",
	UPDATE: "update",
} as const;

export type ButtonDeviceClass =
	(typeof ButtonDeviceClass)[keyof typeof ButtonDeviceClass];

export class Button extends BaseEntity<Date> {
	protected parseState(entity: HassEntity): Date {
		return parseJSON(entity.state);
	}

	get deviceClass() {
		return this.rawEntity.attributes.device_class as
			| ButtonDeviceClass
			| undefined;
	}

	press() {
		return this.callAction("press");
	}
}
