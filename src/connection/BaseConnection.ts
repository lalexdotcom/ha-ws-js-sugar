import type {
	HassEntity,
	HassEvent,
	StateChangedEvent,
} from "home-assistant-js-websocket";
import type { Entity } from "../entities";
import { CoreRegisteredDomains } from "./const";
import type { ActionTarget } from "./types";

type DomainEntityClass = {
	new (conn: BaseConnection, props: HassEntity): Entity;
	readonly domain: string;
};
export abstract class BaseConnection {
	#entityClassRegistry: Map<string, DomainEntityClass>;

	#entityRegistry: Record<string, Entity>;
	#entityRequests: Record<
		string,
		{
			resolve: (entity: Entity | undefined) => void;
			promise: Promise<Entity | undefined>;
		}
	>;
	#entityRequestPromise?: Promise<void>;

	protected abstract getStates(): Promise<HassEntity[]>;
	protected abstract subscribeEvents(
		handler: (event: HassEvent) => void,
	): Promise<() => Promise<void>>;

	#eventsUnsubscribe?: () => Promise<void>;

	constructor() {
		this.#entityRegistry = {};
		this.#entityRequests = {};
		this.#entityClassRegistry = new Map(
			CoreRegisteredDomains.map((cls) => [cls.domain, cls]),
		);
	}

	registerDomainClasses(classes: DomainEntityClass[]) {
		for (const entityClass of classes) {
			this.#entityClassRegistry.set(entityClass.domain, entityClass);
		}
		return this;
	}

	private _hassEventHandler = (event: HassEvent) => {
		if (event.event_type === "state_changed") {
			this._stateChangeHandler(event as StateChangedEvent);
		}
	};

	private _stateChangeHandler(event: StateChangedEvent) {
		const eventData = event.data;
		const entityId = eventData.entity_id;
		const entity = this.#entityRegistry[entityId];
		if (entity && eventData.new_state) {
			entity.hydrate(eventData.new_state);
		}
		this.stateChangeHandler(event);
	}

	// registerDomain<D extends string>(
	// 	domain: D,
	// 	entityClass: (typeof RegisteredDomains)[number],
	// ) {
	// 	this.#registeredDomains.set(domain, entityClass);
	// 	return this as Connection<
	// 		Entities,
	// 		Actions,
	// 		Domains & { [K in D]: (typeof RegisteredDomains)[number] }
	// 	>;
	// }

	protected stateChangeHandler(event: StateChangedEvent) {}

	async getEntity(entityId: string) {
		const entity = this.#entityRegistry[entityId];
		if (!entity) {
			if (this.#entityRequests[entityId]) {
				console.debug(
					"Entity request already in progress, return promise",
					entityId,
				);
				return this.#entityRequests[entityId].promise;
			}
			let entityResolve: (entity: Entity | undefined) => void = () => {};
			const entityPromise = new Promise<Entity | undefined>((resolve) => {
				entityResolve = resolve;
			});
			this.#entityRequests[entityId] ??= {
				resolve: entityResolve,
				promise: entityPromise,
			};
			if (!this.#entityRequestPromise) {
				console.debug("Fetching all states");
				this.#entityRequestPromise = this.getStates().then((states) => {
					console.debug(
						"Processing fetched states for entity requests",
						Object.keys(this.#entityRequests),
					);
					for (const state of states) {
						if (this.#entityRequests[state.entity_id]) {
							const [domain] = state.entity_id.split(".");
							// const entityClass =
							// 	this.#registeredDomains.get(domain) || UnknownEntity;
							// // Create and hydrate new entity
							// const newEntity = new entityClass(this, state);
							// this.#entityRegistry[state.entity_id] = newEntity;
							// newEntity.hydrate(state);

							// // Remove request from queue and resolve promise
							// this.#entityRequests[state.entity_id].resolve(newEntity);
							// delete this.#entityRequests[state.entity_id];
						}
						for (const [entity_id, { resolve }] of Object.entries(
							this.#entityRequests,
						)) {
							if (!states.find((s) => s.entity_id === entity_id)) {
								console.debug(
									"Entity not found in states, resolving as undefined",
									entity_id,
								);
								resolve(undefined);
								delete this.#entityRequests[entity_id];
							}
						}
					}
					this.#entityRequestPromise = undefined;
				});
			}
			return entityPromise;
		}
		console.debug("Entity found in registry", entityId);
		return entity;
	}

	abstract callAction(
		action: `${string}.${string}`,
		target?: ActionTarget,
		data?: Record<string, unknown>,
		result?: boolean,
	): Promise<void>;

	// async callAction<T>(
	// 	domain: string,
	// 	service: string,
	// 	{ data, target }: CallActionParams = {},
	// 	result = false,
	// ) {
	// 	try {
	// 		const serviceCallResult = await callService(
	// 			this.#haConnection,
	// 			domain,
	// 			service,
	// 			data,
	// 			target,
	// 			result,
	// 		);
	// 		if (result) return serviceCallResult as Promise<T>;
	// 	} catch (error) {
	// 		console.error(
	// 			"Error calling action",
	// 			error instanceof Error ? error.message : error,
	// 			{ domain, service, data, target },
	// 		);
	// 		throw error;
	// 	}
	// }
}
