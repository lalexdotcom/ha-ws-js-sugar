import type { States } from "../../../const";
import { BaseEntity } from "../Entity";

export class BinarySensor extends BaseEntity<States.ON | States.OFF> {}
