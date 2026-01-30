import { ToggleBase } from "../helpers/ToggleBase";

type LightParams = {
	transition?: number;
	flash?: "short" | "long";
	effect?: string;

	brightness?: number;
	brightnessPercent?: number;
	brightnessStep?: number;
	brightnessStepPercent?: number;

	hsColor?: [number, number];
	xyColor?: [number, number];
	rgbColor?: [number, number, number];
	rgbwColor?: [number, number, number, number];
	rgbwwColor?: [number, number, number, number, number];

	colorTempKelvin?: number;
	colorName?: LightColorName;

	white?: boolean;
};

const LIGHT_PARAMS_PROPERTIES_MAP: Partial<Record<keyof LightParams, string>> =
	{
		brightnessPercent: "brightness_pct",
		brightnessStep: "brightness_step",
		brightnessStepPercent: "brightness_step_pct",

		hsColor: "hs_color",
		xyColor: "xy_color",
		rgbColor: "rgb_color",
		rgbwColor: "rgbw_color",
		rgbwwColor: "rgbww_color",

		colorTempKelvin: "color_temp_kelvin",
		colorName: "color_name",
	};

export const LightFeatures = {
	EFFECT: 4,
	FLASH: 8,
	TRANSITION: 32,
} as const;

export type LightFeature = (typeof LightFeatures)[keyof typeof LightFeatures];

export const LightColorModes = {
	UNKNOWN: "unknown",
	ONOFF: "onoff",
	BRIGHTNESS: "brightness",
	COLOR_TEMP: "color_temp",
	HS: "hs",
	XY: "xy",
	RGB: "rgb",
	RGBW: "rgbw",
	RGBWW: "rgbww",
	WHITE: "white",
} as const;

export type LightColorMode =
	(typeof LightColorModes)[keyof typeof LightColorModes];

const paramsToProperties = (params?: LightParams) => {
	return (
		params &&
		Object.fromEntries(
			Object.entries(params).map(([key, value]) => [
				LIGHT_PARAMS_PROPERTIES_MAP[key as keyof LightParams] || key,
				value,
			]),
		)
	);
};

export class Light extends ToggleBase {
	static readonly domain = "light" as const;

	turnOn(params?: LightParams) {
		this.callAction("turn_on", paramsToProperties(params));
	}

	toggle(params?: LightParams) {
		this.callAction("toggle", paramsToProperties(params));
	}

	isFeatureSupported(feature: LightFeature): boolean {
		return super._isFeatureSupported(feature);
	}

	supportColorMode(mode: LightColorMode) {
		return this.rawEntity.attributes.supported_color_modes?.includes(mode);
	}

	get colorMode() {
		return this.rawEntity.attributes.color_mode as LightColorMode;
	}

	get minColorTempKelvin() {
		return this.rawEntity.attributes.min_color_temp_kelvin as number;
	}

	get maxColorTempKelvin() {
		return this.rawEntity.attributes.max_color_temp_kelvin as number;
	}
}

export const LightColorNames = {
	ALICEBLUE: "aliceblue",
	ANTIQUEWHITE: "antiquewhite",
	AQUA: "aqua",
	AQUAMARINE: "aquamarine",
	AZURE: "azure",
	BEIGE: "beige",
	BISQUE: "bisque",
	BLACK: "black",
	BLANCHEDALMOND: "blanchedalmond",
	BLUE: "blue",
	BLUEVIOLET: "blueviolet",
	BROWN: "brown",
	BURLYWOOD: "burlywood",
	CADETBLUE: "cadetblue",
	CHARTREUSE: "chartreuse",
	CHOCOLATE: "chocolate",
	CORAL: "coral",
	CORNFLOWERBLUE: "cornflowerblue",
	CORNSILK: "cornsilk",
	CRIMSON: "crimson",
	CYAN: "cyan",
	DARKBLUE: "darkblue",
	DARKCYAN: "darkcyan",
	DARKGOLDENROD: "darkgoldenrod",
	DARKGRAY: "darkgray",
	DARKGREY: "darkgrey",
	DARKGREEN: "darkgreen",
	DARKKHAKI: "darkkhaki",
	DARKMAGENTA: "darkmagenta",
	DARKOLIVEGREEN: "darkolivegreen",
	DARKORANGE: "darkorange",
	DARKORCHID: "darkorchid",
	DARKRED: "darkred",
	DARKSALMON: "darksalmon",
	DARKSEAGREEN: "darkseagreen",
	DARKSLATEBLUE: "darkslateblue",
	DARKSLATEGRAY: "darkslategray",
	DARKSLATEGREY: "darkslategrey",
	DARKTURQUOISE: "darkturquoise",
	DARKVIOLET: "darkviolet",
	DEEPPINK: "deeppink",
	DEEPSKYBLUE: "deepskyblue",
	DIMGRAY: "dimgray",
	DIMGREY: "dimgrey",
	DODGERBLUE: "dodgerblue",
	FIREBRICK: "firebrick",
	FLORALWHITE: "floralwhite",
	FORESTGREEN: "forestgreen",
	FUCHSIA: "fuchsia",
	GAINSBORO: "gainsboro",
	GHOSTWHITE: "ghostwhite",
	GOLD: "gold",
	GOLDENROD: "goldenrod",
	GRAY: "gray",
	GREY: "grey",
	GREEN: "green",
	GREENYELLOW: "greenyellow",
	HONEYDEW: "honeydew",
	HOTPINK: "hotpink",
	INDIANRED: "indianred",
	INDIGO: "indigo",
	IVORY: "ivory",
	KHAKI: "khaki",
	LAVENDER: "lavender",
	LAVENDERBLUSH: "lavenderblush",
	LAWNGREEN: "lawngreen",
	LEMONCHIFFON: "lemonchiffon",
	LIGHTBLUE: "lightblue",
	LIGHTCORAL: "lightcoral",
	LIGHTCYAN: "lightcyan",
	LIGHTGOLDENRODYELLOW: "lightgoldenrodyellow",
	LIGHTGRAY: "lightgray",
	LIGHTGREY: "lightgrey",
	LIGHTGREEN: "lightgreen",
	LIGHTPINK: "lightpink",
	LIGHTSALMON: "lightsalmon",
	LIGHTSEAGREEN: "lightseagreen",
	LIGHTSKYBLUE: "lightskyblue",
	LIGHTSLATEGRAY: "lightslategray",
	LIGHTSLATEGREY: "lightslategrey",
	LIGHTSTEELBLUE: "lightsteelblue",
	LIGHTYELLOW: "lightyellow",
	LIME: "lime",
	LIMEGREEN: "limegreen",
	LINEN: "linen",
	MAGENTA: "magenta",
	MAROON: "maroon",
	MEDIUMAQUAMARINE: "mediumaquamarine",
	MEDIUMBLUE: "mediumblue",
	MEDIUMORCHID: "mediumorchid",
	MEDIUMPURPLE: "mediumpurple",
	MEDIUMSEAGREEN: "mediumseagreen",
	MEDIUMSLATEBLUE: "mediumslateblue",
	MEDIUMSPRINGGREEN: "mediumspringgreen",
	MEDIUMTURQUOISE: "mediumturquoise",
	MEDIUMVIOLETRED: "mediumvioletred",
	MIDNIGHTBLUE: "midnightblue",
	MINTCREAM: "mintcream",
	MISTYROSE: "mistyrose",
	MOCCASIN: "moccasin",
	NAVAJOWHITE: "navajowhite",
	NAVY: "navy",
	OLDLACE: "oldlace",
	OLIVE: "olive",
	OLIVEDRAB: "olivedrab",
	ORANGE: "orange",
	ORANGERED: "orangered",
	ORCHID: "orchid",
	PALEGOLDENROD: "palegoldenrod",
	PALEGREEN: "palegreen",
	PALETURQUOISE: "paleturquoise",
	PALEVIOLETRED: "palevioletred",
	PAPAYAWHIP: "papayawhip",
	PEACHPUFF: "peachpuff",
	PERU: "peru",
	PINK: "pink",
	PLUM: "plum",
	POWDERBLUE: "powderblue",
	PURPLE: "purple",
	REBECCAPURPLE: "rebeccapurple",
	RED: "red",
	ROSYBROWN: "rosybrown",
	ROYALBLUE: "royalblue",
	SADDLEBROWN: "saddlebrown",
	SALMON: "salmon",
	SANDYBROWN: "sandybrown",
	SEAGREEN: "seagreen",
	SEASHELL: "seashell",
	SIENNA: "sienna",
	SILVER: "silver",
	SKYBLUE: "skyblue",
	SLATEBLUE: "slateblue",
	SLATEGRAY: "slategray",
	SLATEGREY: "slategrey",
	SNOW: "snow",
	SPRINGGREEN: "springgreen",
	STEELBLUE: "steelblue",
	TAN: "tan",
	TEAL: "teal",
	THISTLE: "thistle",
	TOMATO: "tomato",
	TURQUOISE: "turquoise",
	VIOLET: "violet",
	WHEAT: "wheat",
	WHITE: "white",
	WHITESMOKE: "whitesmoke",
	YELLOW: "yellow",
	YELLOWGREEN: "yellowgreen",
} as const;

export type LightColorName =
	(typeof LightColorNames)[keyof typeof LightColorNames];
