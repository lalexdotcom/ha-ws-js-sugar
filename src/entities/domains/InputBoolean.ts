import { ToggleBase } from "../helpers/ToggleBase";

export class InputBoolean extends ToggleBase {
	static readonly domain = "input_boolean" as const;

	reload() {
		return this.callAction("reload");
	}
}
