import {
	callService,
	getStates,
	type Connection as HAConnection,
	type HassEvent,
	type HassServiceTarget,
} from "home-assistant-js-websocket";
import { Connection } from "./Connection";
import type {
	ActionRegistry,
	ActionTarget,
	DomainRegistry,
	EntityName,
} from "./types";

const actionTargetToSocketTarget = (
	target?: ActionTarget,
): HassServiceTarget | undefined => {
	if (!target) return undefined;
	const socketTarget: HassServiceTarget = {};
	if ("entityId" in target) {
		socketTarget.entity_id = target.entityId;
	} else if ("entity" in target)
		if (target.entity)
			socketTarget.entity_id = Array.isArray(target.entity)
				? target.entity.map((e) => e.id)
				: target.entity.id;
	if ("deviceId" in target) {
		socketTarget.device_id = target.deviceId;
	}
	if ("areaId" in target) {
		socketTarget.area_id = target.areaId;
	}
	if ("floorId" in target) {
		socketTarget.floor_id = target.floorId;
	}
	if ("labelId" in target) {
		socketTarget.label_id = target.labelId;
	}
	return socketTarget;
};

export class SocketConnection<
	DR extends DomainRegistry = Record<string, never>,
	E extends EntityName = EntityName,
	AR extends ActionRegistry = Record<string, never>,
> extends Connection<DR, E, AR> {
	#haConnection: HAConnection;

	constructor(haConnection: HAConnection) {
		super();
		this.#haConnection = haConnection;
	}

	protected subscribeEvents(handler: (event: HassEvent) => void) {
		return this.#haConnection.subscribeEvents(handler);
	}

	async getStates() {
		return getStates(this.#haConnection);
	}

	async callAction<T = unknown>(
		action: `${string}.${string}`,
		target?: ActionTarget,
		data?: Record<string, unknown>,
		result = false,
	): Promise<T | void> {
		try {
			const [domain, ...service] = action.split(".") as [string, string];
			const serviceCallResult = await callService(
				this.#haConnection,
				domain,
				service.join("."),
				data,
				actionTargetToSocketTarget(target),
				result,
			);
			if (result) return serviceCallResult as T;
		} catch (error) {
			console.error(
				"Error calling action",
				error instanceof Error ? error.message : error,
				{ action, data, target },
			);
			throw error;
		}
	}
}
