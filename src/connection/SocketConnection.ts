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
	if (target.entity)
		socketTarget.entity_id = Array.isArray(target.entity)
			? target.entity.map((e) => e.id)
			: target.entity.id;
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

	subscribeEvents(handler: (event: HassEvent) => void) {
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
