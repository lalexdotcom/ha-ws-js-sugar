import type {
	HassEntity,
	HassEvent,
	StateChangedEvent,
} from "home-assistant-js-websocket";
import { CoreRegisteredDomains } from "../const";
import { type Entity, UnknownEntity } from "../entities";
import type {
	ActionRegistry,
	ActionTarget,
	DomainEntityClass,
	DomainRegistry,
	EntityName,
	RegistryActionName,
} from "./types";

type DomainCallAction<AR extends ActionRegistry, D extends string> = {
	callAction: {
		<T = unknown>(
			action: D extends keyof AR ? `${AR[D][number]}` : string,
			target: ActionTarget | undefined,
			data: Record<string, unknown> | undefined,
			result: true,
		): Promise<T>;
		(
			action: D extends keyof AR ? `${AR[D][number]}` : string,
			data?: Record<string, unknown>,
		): Promise<void>;
	};
};

export abstract class Connection<
	DR extends DomainRegistry = {},
	E extends EntityName = EntityName,
	AR extends ActionRegistry = {},
> {
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

	#eventsUnsubscribe?: () => Promise<void>;
	#eventListeners: Set<(event: HassEvent) => void> = new Set();

	abstract getStates(): Promise<HassEntity[]>;
	protected abstract subscribeEvents(
		handler: (event: HassEvent) => void,
	): Promise<() => Promise<void>>;

	constructor() {
		this.#entityRegistry = {};
		this.#entityRequests = {};
		this.#entityClassRegistry = new Map(
			CoreRegisteredDomains.map((cls) => [cls.domain, cls]),
		);
	}

	async addEventsListener(
		listener: (event: HassEvent) => void,
	): Promise<() => Promise<void>> {
		this.#eventListeners.add(listener);
		if (!this.#eventsUnsubscribe) {
			this.#eventsUnsubscribe = await this.subscribeEvents(
				(event: HassEvent) => {
					for (const lst of this.#eventListeners) {
						lst(event);
					}
				},
			);
		}
		return () => this.removeEventsListener(listener);
	}

	async removeEventsListener(listener: (event: HassEvent) => void) {
		this.#eventListeners.delete(listener);
		if (this.#eventListeners.size === 0) {
			const unsubscribe = this.#eventsUnsubscribe;
			this.#eventsUnsubscribe = undefined;
			await unsubscribe?.();
		}
	}

	// Add a domain entity class to the registry
	// Return this with the updated type
	registerDomain<DEC extends DomainEntityClass[]>(classes: DEC) {
		for (const entityClass of classes) {
			this.#entityClassRegistry.set(entityClass.domain, entityClass);
		}
		return this as Connection<
			{
				[K in DEC[number] as K["domain"]]: K;
			} & DR,
			E,
			AR
		>;
	}

	handleEntityStateChangedEvent = (event: HassEvent) => {
		if (event.event_type === "state_changed") {
			const eventData = (event as StateChangedEvent).data;
			const entityId = eventData.entity_id;
			const entity = this.#entityRegistry[entityId];
			if (entity && eventData.new_state) {
				entity.hydrate(eventData.new_state);
			}
		}
	};

	// getEntity with domain check and action mixin
	getEntity<ENTITY_ID extends E>(
		entityId: ENTITY_ID,
	): Promise<
		ENTITY_ID extends `${infer D}.${string}`
			? (D extends keyof DR ? InstanceType<DR[D]> : UnknownEntity) &
					DomainCallAction<AR, D>
			: undefined
	>;

	// Generic getEntity
	getEntity<ENTITY_ID extends EntityName>(
		entityId: ENTITY_ID,
	): Promise<
		ENTITY_ID extends `${infer D}.${string}`
			? (D extends keyof DR ? InstanceType<DR[D]> : UnknownEntity) &
					DomainCallAction<AR, D>
			: undefined
	>;

	// Castable getEntity
	getEntity<EntityType extends Entity = UnknownEntity>(
		entityId: EntityName,
	): Promise<EntityType | undefined>;
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
				this.#entityRequestPromise = this.getStates().then(async (states) => {
					console.debug(
						"Processing fetched states for entity requests",
						Object.keys(this.#entityRequests),
					);
					for (const state of states) {
						if (this.#entityRequests[state.entity_id]) {
							// Start listening events only at first successful entity
							await this.addEventsListener(this.handleEntityStateChangedEvent);
							const [domain] = state.entity_id.split(".");
							const entityClass =
								this.#entityClassRegistry.get(domain) || UnknownEntity;

							// Create and hydrate new entity
							const newEntity = new entityClass(this as Connection, state);
							this.#entityRegistry[state.entity_id] = newEntity;
							newEntity.hydrate(state);

							// Remove request from queue and resolve promise
							this.#entityRequests[state.entity_id].resolve(newEntity);
							delete this.#entityRequests[state.entity_id];
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

	// Release entity
	async releaseEntity(entity: Entity) {
		delete this.#entityRegistry[entity.id];
		if (!Object.values(this.#entityRegistry).length) {
			await this.removeEventsListener(this.handleEntityStateChangedEvent);
		}
	}

	// call registered action with result
	abstract callAction<T = unknown>(
		action: RegistryActionName<AR>,
		target: ActionTarget | undefined,
		data: Record<string, unknown> | undefined,
		result: true,
	): Promise<T>;

	// call registered action without result
	abstract callAction(
		action: RegistryActionName<AR>,
		target?: ActionTarget,
		data?: Record<string, unknown>,
		result?: boolean,
	): Promise<void>;

	// call generic action with result
	abstract callAction<T = unknown>(
		action: `${string}.${string}`,
		target: ActionTarget | undefined,
		data: Record<string, unknown> | undefined,
		result: true,
	): Promise<T>;

	// call generic action without result
	abstract callAction(
		action: `${string}.${string}`,
		target?: ActionTarget,
		data?: Record<string, unknown>,
		result?: boolean,
	): Promise<unknown>;
}
