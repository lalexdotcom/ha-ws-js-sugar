import type { States } from "../../../const";
import { Entity } from "../Entity";

export class BinarySensor extends Entity<States.ON | States.OFF> {}
