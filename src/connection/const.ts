import type { HassEntity } from "home-assistant-js-websocket";
import type { Entity } from "../entities";
import { Alarm } from "../entities/domains/Alarm";
import { BinarySensor } from "../entities/domains/BinarySensor";
import { Button } from "../entities/domains/Button";
import { Climate } from "../entities/domains/Climate";
import { Cover } from "../entities/domains/Cover";
import { DeviceTracker } from "../entities/domains/DeviceTracker";
import { InputBoolean } from "../entities/domains/InputBoolean";
import { InputButton } from "../entities/domains/InputButton";
import { InputDatetime } from "../entities/domains/InputDateTime";
import { InputNumber } from "../entities/domains/InputNumber";
import { InputSelect } from "../entities/domains/InputSelect";
import { Light } from "../entities/domains/Light";
import { MediaPlayer } from "../entities/domains/MediaPlayer";
import { Sensor } from "../entities/domains/Sensor";
import { WaterHeater } from "../entities/domains/WaterHeater";
import type { BaseConnection } from "./BaseConnection";

export const CoreRegisteredDomains = [
	Alarm,
	Button,
	BinarySensor,
	Climate,
	Cover,
	DeviceTracker,
	InputButton,
	InputBoolean,
	InputDatetime,
	InputNumber,
	InputSelect,
	Light,
	MediaPlayer,
	// Sensor,
	WaterHeater,
] as const satisfies {
	new (conn: BaseConnection, props: HassEntity): Entity;
	readonly domain: string;
}[];

CoreRegisteredDomains.reduce((domains, domainClass) => {
	if (domains.has(domainClass.domain)) {
		throw new Error(
			`Duplicate domain registration for domain ${domainClass.domain}`,
		);
	}
	domains.add(domainClass.domain);
	return domains;
}, new Set<string>());
