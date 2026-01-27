import { BinarySensor } from "./BinarySensor";

export class Switch extends BinarySensor {
	turnOn() {
		this.callAction("turn_on");
	}

	turnOff() {
		this.callAction("turn_off");
	}

	toggle() {
		this.callAction("toggle");
	}
}
