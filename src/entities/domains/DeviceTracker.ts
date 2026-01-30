import { Entity } from "..";
import type { State } from "../types";

export const DeviceTrackerSourceTypes = {
	GPS: "gps",
	ROUTER: "router",
	BLUETOOTH: "bluetooth",
	BLUETOOTH_LE: "bluetooth_le",
} as const;

export type DeviceTrackerSourceType =
	(typeof DeviceTrackerSourceTypes)[keyof typeof DeviceTrackerSourceTypes];

export type DeviceTrackerGPSInfos = {
	location: string;
	latitude: number;
	longitude: number;
	accuracy: number;
	altitude?: number;
};

export type DeviceTrackerRouterInfos = {
	hostname: string;
	ip: string;
	mac: string;
};

type DeviceTrackerSourceInfosMap = {
	[DeviceTrackerSourceTypes.GPS]: DeviceTrackerGPSInfos;
	[DeviceTrackerSourceTypes.ROUTER]: DeviceTrackerRouterInfos;
};

const DEVICE_TRACKER_PROPS_MAP: Record<
	string,
	keyof DeviceTrackerGPSInfos | keyof DeviceTrackerRouterInfos
> = {
	// GPS property
	location_name: "location",
	location_accuracy: "accuracy",

	// Router properties
	ip_address: "ip",
	mac_address: "mac",
	host_name: "hostname",
};

export class DeviceTracker<
	SourceType extends DeviceTrackerSourceType | undefined,
	ExtraInfos extends Record<string, unknown> = Record<string, unknown>,
> extends Entity<State.HOME | State.NOT_HOME> {
	static readonly domain = "device_tracker" as const;

	get sourceType() {
		return this.rawEntity.attributes.source_type as DeviceTrackerSourceType;
	}

	get batteryLevel() {
		return this.rawEntity.attributes.battery_level as number | undefined;
	}

	get infos(): SourceType extends keyof DeviceTrackerSourceInfosMap
		? DeviceTrackerSourceInfosMap[SourceType] & ExtraInfos
		: unknown {
		const {
			battery_level: _,
			source_type: __,
			is_connected: ___,
			friendly_name: ____,
			...rest
		} = this.rawEntity.attributes;
		// Map properties. If no mapping, convert to camelCase
		return Object.fromEntries(
			Object.entries(rest).map(([key, value]) => [
				DEVICE_TRACKER_PROPS_MAP[key] ||
					key
						.split("_")
						.filter(Boolean)
						.map((part, index) =>
							index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
						)
						.join(""),
				value,
			]),
			// biome-ignore lint/suspicious/noExplicitAny: <dynamic return type>
		) as any;
	}
}

export type GPSDeviceTracker<
	ExtraInfos extends Record<string, unknown> = Record<string, unknown>,
> = DeviceTracker<"gps", ExtraInfos>;

export type RouterDeviceTracker<
	ExtraInfos extends Record<string, unknown> = Record<string, unknown>,
> = DeviceTracker<"router", ExtraInfos>;
