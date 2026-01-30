import { Entity } from "..";
import type { State } from "../types";

export class BinarySensor extends Entity<State.ON | State.OFF> {
	static readonly domain = "binary_sensor" as const;
}
