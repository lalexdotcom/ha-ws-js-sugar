import { Entity } from "..";
import { ToggleBase } from "../helpers/ToggleBase";
import type { State } from "../types";

export class Switch extends ToggleBase {
	static readonly domain = "switch" as const;
}
