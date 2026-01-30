import {
	callService,
	getStates,
	type Connection as HAConnection,
	type HassEvent,
	type HassServiceTarget,
} from "home-assistant-js-websocket";
import { BaseConnection } from "./BaseConnection";
import type { ActionTarget } from "./types";

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

export class SocketConnection extends BaseConnection {
	#haConnection: HAConnection;

	constructor(haConnection: HAConnection) {
		super();
		this.#haConnection = haConnection;
	}

	protected subscribeEvents(handler: (event: HassEvent) => void) {
		return this.#haConnection.subscribeEvents(handler);
	}

	protected async getStates() {
		return getStates(this.#haConnection);
	}

	async callAction(
		action: `${string}.${string}`,
		target?: ActionTarget,
		data?: Record<string, unknown>,
		result = false,
	) {
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
			if (result) return serviceCallResult as Promise<unknown>;
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
