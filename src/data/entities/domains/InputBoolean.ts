import { BinarySensor } from "./BinarySensor";
import { Switch } from "./Switch";

export class InputBoolean extends Switch {
	reload() {
		return this.callAction("reload");
	}
}
