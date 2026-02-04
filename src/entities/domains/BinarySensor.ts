import { Entity } from "..";
import type { State } from "../const";

export class BinarySensor extends Entity<State.ON | State.OFF> {
	static readonly domain = "binary_sensor" as const;
}
