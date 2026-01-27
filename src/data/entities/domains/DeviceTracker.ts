import type { States } from "../../../const";
import { BaseEntity } from "../Entity";

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
	ExtraInfos extends Record<string, unknown> = {},
> extends BaseEntity<States.HOME | States.NOT_HOME> {
	get sourceType() {
		return this.rawEntity.attributes.source_type as DeviceTrackerSourceType;
	}

	get batteryLevel() {
		return this.rawEntity.attributes.battery_level as number | undefined;
	}

	get infos(): SourceType extends keyof DeviceTrackerSourceInfosMap
		? DeviceTrackerSourceInfosMap[SourceType] & ExtraInfos
		: unknown {
		const { battery_level, source_type, is_connected, friendly_name, ...rest } =
			this.rawEntity.attributes;
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
		) as any;
	}
}

export class GPSDeviceTracker<
	ExtraInfos extends Record<string, unknown> = {},
> extends DeviceTracker<"gps", ExtraInfos> {}

export class RouterDeviceTracker<
	ExtraInfos extends Record<string, unknown> = {},
> extends DeviceTracker<"router", ExtraInfos> {}
