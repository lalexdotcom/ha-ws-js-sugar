import { ButtonBase } from "../helpers/ButtonBase";

export const ButtonDeviceClass = {
	IDENTIFY: "identify",
	RESTART: "restart",
	UPDATE: "update",
} as const;

export type ButtonDeviceClass =
	(typeof ButtonDeviceClass)[keyof typeof ButtonDeviceClass];

export class Button extends ButtonBase {
	static readonly domain = "button" as const;

	get deviceClass() {
		return this.rawEntity.attributes.device_class as
			| ButtonDeviceClass
			| undefined;
	}
}
