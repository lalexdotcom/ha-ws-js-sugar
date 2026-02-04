import { Entity } from "..";
import type { State } from "../const";

export class ToggleBase extends Entity<State.ON | State.OFF> {
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
