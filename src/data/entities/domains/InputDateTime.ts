import { type DateArg, fromUnixTime, getUnixTime } from "date-fns";
import type { HassEntity } from "home-assistant-js-websocket";
import { Entity } from "../Entity";

export class InputDatetime extends Entity<Date> {
	protected parseState(entity: HassEntity): Date {
		return fromUnixTime(entity.attributes.timestamp);
	}

	get hasDate() {
		return !!this.rawEntity.attributes.has_date;
	}

	get hasTime() {
		return !!this.rawEntity.attributes.has_time;
	}

	setValue(value: DateArg<Date>) {
		return this.callAction("set_datetime", { timestamp: getUnixTime(value) });
	}

	reload() {
		return this.callAction("reload");
	}
}
