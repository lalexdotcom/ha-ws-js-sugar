import { parseJSON } from "date-fns";
import type { HassEntity } from "home-assistant-js-websocket";
import { Entity } from "..";

export class ButtonBase extends Entity<Date> {
	protected parseState(entity: HassEntity): Date {
		return parseJSON(entity.state);
	}

	press() {
		return this.callAction("press");
	}
}
