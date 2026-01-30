import {
	callService,
	createConnection as createHAConnection,
	createLongLivedTokenAuth,
	getStates,
	type Connection as HAConnection,
	type HassEntity,
	type HassEvent,
	type HassServiceTarget,
	type StateChangedEvent,
} from "home-assistant-js-websocket";
import { Alarm } from "../data/entities/domains/Alarm";
import { BinarySensor } from "../data/entities/domains/BinarySensor";
import { Button } from "../data/entities/domains/Button";
import { Climate } from "../data/entities/domains/Climate";
import { Cover } from "../data/entities/domains/Cover";
import { DeviceTracker } from "../data/entities/domains/DeviceTracker";
import { InputBoolean } from "../data/entities/domains/InputBoolean";
import { InputDatetime } from "../data/entities/domains/InputDateTime";
import { InputNumber } from "../data/entities/domains/InputNumber";
import { InputSelect } from "../data/entities/domains/InputSelect";
import { Light } from "../data/entities/domains/Light";
import { MediaPlayer } from "../data/entities/domains/MediaPlayer";
import { Sensor } from "../data/entities/domains/Sensor";
import { WaterHeater } from "../data/entities/domains/WaterHeater";
import { type Entity, UnknownEntity } from "../data/entities/Entity";
import { type Domain, Domains } from "../data/types";

type CreateConnectionOptions = {
	host: string;
	token: string;
};

const DEFAULT_DOMAINS = {
	[Domains.ALARM]: Alarm,
	[Domains.BUTTON]: Button,
	[Domains.BINARY_SENSOR]: BinarySensor,
	[Domains.CLIMATE]: Climate,
	[Domains.COVER]: Cover,
	[Domains.DEVICE_TRACKER]: DeviceTracker<undefined>,
	[Domains.INPUT_BUTTON]: Button,
	[Domains.INPUT_BOOLEAN]: InputBoolean,
	[Domains.INPUT_DATETIME]: InputDatetime,
	[Domains.INPUT_NUMBER]: InputNumber,
	[Domains.INPUT_SELECT]: InputSelect,
	[Domains.LIGHT]: Light,
	[Domains.MEDIA_PLAYER]: MediaPlayer,
	[Domains.SENSOR]: Sensor,
	[Domains.WATER_HEATER]: WaterHeater,
} as const satisfies Partial<
	Record<Domain, { new (conn: Connection, props: HassEntity): Entity }>
>;

export type CallActionParams = {
	data?: Record<string, unknown>;
	target?: HassServiceTarget;
};

export interface Connection<
	EntityIds extends `${string}.${string}` = `${string}.${string}`,
> {
	getEntity<ENTITY_ID extends EntityIds>(
		entityId: ENTITY_ID,
	): Promise<
		ENTITY_ID extends `${infer D}.${string}`
			? D extends keyof typeof DEFAULT_DOMAINS
				? InstanceType<(typeof DEFAULT_DOMAINS)[D]>
				: UnknownEntity
			: undefined
	>;
	getEntity<ENTITY_ID extends `${string}.${string}`>(
		entityId: ENTITY_ID,
	): Promise<
		ENTITY_ID extends `${infer D}.${string}`
			? D extends keyof typeof DEFAULT_DOMAINS
				? InstanceType<(typeof DEFAULT_DOMAINS)[D]>
				: UnknownEntity
			: undefined
	>;
	getEntity<EntityType extends Entity<unknown>>(
		entityId: `${string}.${string}`,
	): Promise<EntityType | undefined>;

	callAction<T = unknown>(
		domain: Domain | (string & {}),
		service: string,
		params: CallActionParams | undefined,
		result: true,
	): Promise<T>;
	callAction(
		domain: Domain | (string & {}),
		service: string,
		params?: CallActionParams,
		result?: boolean,
	): Promise<void>;
}

export const createConnection = async <
	EntityIds extends `${string}.${string}` = `${string}.${string}`,
>(
	options?: CreateConnectionOptions,
): Promise<Connection<EntityIds>> => {
	if (options) {
		const auth = createLongLivedTokenAuth(options.host, options.token);
		const haConnection = await createHAConnection({ auth });
		const connection = new MainConnection<EntityIds>(haConnection);
		return connection;
	}
	throw new Error("Should have options");
};

class MainConnection<
	EntityIds extends `${string}.${string}` = `${string}.${string}`,
> implements Connection<EntityIds>
{
	// static async create<
	// 	EntityIds extends `${string}.${string}` = `${string}.${string}`,
	// >(options: CreateConnectionOptions) {
	// 	const auth = createLongLivedTokenAuth(options.host, options.token);
	// 	const haConnection = await createHAConnection({ auth });
	// 	const connection = new MainConnection<EntityIds>(haConnection);
	// 	return connection;
	// }

	#haConnection: HAConnection;
	#entityRegistry: Record<string, Entity>;
	#entityRequests: Record<
		string,
		{
			resolve: (entity: Entity | undefined) => void;
			promise: Promise<Entity | undefined>;
		}
	>;
	#entityRequestPromise?: Promise<void>;

	constructor(haConnection: HAConnection) {
		this.#haConnection = haConnection;
		this.#entityRegistry = {};
		this.#entityRequests = {};
		haConnection.subscribeEvents((event: HassEvent) => {
			switch (event.event_type) {
				case "state_changed": {
					const stateChangedEvent = event as StateChangedEvent;
					const eventData = stateChangedEvent.data;
					const entityId = eventData.entity_id;
					const entity = this.#entityRegistry[entityId];
					if (entity && eventData.new_state) {
						entity.hydrate(eventData.new_state);
					}
					break;
				}
			}
		});
	}

	getEntity<ENTITY_ID extends EntityIds>(
		entityId: ENTITY_ID,
	): Promise<
		ENTITY_ID extends `${infer D}.${string}`
			? D extends keyof typeof DEFAULT_DOMAINS
				? InstanceType<(typeof DEFAULT_DOMAINS)[D]>
				: UnknownEntity
			: undefined
	>;
	getEntity<ENTITY_ID extends `${string}.${string}`>(
		entityId: ENTITY_ID,
	): Promise<
		ENTITY_ID extends `${infer D}.${string}`
			? D extends keyof typeof DEFAULT_DOMAINS
				? InstanceType<(typeof DEFAULT_DOMAINS)[D]>
				: UnknownEntity
			: undefined
	>;
	getEntity<EntityType extends Entity<unknown>>(
		entityId: `${string}.${string}`,
	): Promise<EntityType | undefined>;
	async getEntity(entityId: string) {
		console.info("Getting entity", entityId);
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
				this.#entityRequestPromise = getStates(this.#haConnection).then(
					(states) => {
						console.debug(
							"Processing fetched states for entity requests",
							Object.keys(this.#entityRequests),
						);
						for (const state of states) {
							if (this.#entityRequests[state.entity_id]) {
								const [domain] = state.entity_id.split(".") as [
									Domain,
									...string[],
								];
								const EntityClass = DEFAULT_DOMAINS[domain] || UnknownEntity;
								const newEntity = new EntityClass(this, state);
								this.#entityRegistry[state.entity_id] = newEntity;
								newEntity.hydrate(state);
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
					},
				);
			}
			return entityPromise;
		}
		console.debug("Entity found in registry", entityId);
		return entity;
	}

	callAction<T = unknown>(
		domain: Domain | (string & {}),
		service: string,
		params: CallActionParams | undefined,
		result: true,
	): Promise<T>;
	callAction(
		domain: Domain | (string & {}),
		service: string,
		params?: CallActionParams,
		result?: boolean,
	): Promise<void>;
	async callAction<T = unknown>(
		domain: Domain | (string & {}),
		service: string,
		{ data, target }: CallActionParams = {},
		result = false,
	) {
		try {
			const serviceCallResult = await callService(
				this.#haConnection,
				domain,
				service,
				data,
				target,
				result,
			);
			if (result) return serviceCallResult as Promise<T>;
		} catch (error) {
			console.error(
				"Error calling action",
				error instanceof Error ? error.message : error,
				{ domain, service, data, target },
			);
			throw error;
		}
	}
}
