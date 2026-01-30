import { Entity } from "..";
import { ToggleBase } from "../helpers/ToggleBase";
import type { State } from "../types";

export class InputBoolean extends ToggleBase {
	static readonly domain = "input_boolean" as const;

	reload() {
		return this.callAction("reload");
	}
}
