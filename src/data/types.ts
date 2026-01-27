export const Domains = {
	ALARM: "alarm_control_panel",
	BINARY_SENSOR: "binary_sensor",
	BUTTON: "button",
	CLIMATE: "climate",
	COVER: "cover",
	DEVICE_TRACKER: "device_tracker",
	INPUT_BUTTON: "input_button",
	INPUT_BOOLEAN: "input_boolean",
	INPUT_DATETIME: "input_datetime",
	INPUT_NUMBER: "input_number",
	INPUT_SELECT: "input_select",
	LIGHT: "light",
	MEDIA_PLAYER: "media_player",
	SENSOR: "sensor",
	WATER_HEATER: "water_heater",
} as const;

export type Domain = (typeof Domains)[keyof typeof Domains];
