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
import { type BaseEntity, UnknownEntity } from "../data/entities/Entity";
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
	Record<Domain, { new (conn: Connection, props: HassEntity): BaseEntity<any> }>
>;

export type CallActionParams = {
	data?: Record<string, unknown>;
	target?: HassServiceTarget;
};

export class Connection<
	EntityIds extends `${string}.${string}` = `${string}.${string}`,
> {
	static async create<
		EntityIds extends `${string}.${string}` = `${string}.${string}`,
	>(options: CreateConnectionOptions) {
		const auth = createLongLivedTokenAuth(options.host, options.token);
		const haConnection = await createHAConnection({ auth });
		const connection = new Connection<EntityIds>(haConnection);
		return connection;
	}

	#haConnection: HAConnection;
	#entityRegistry: Map<string, BaseEntity> = new Map();

	private constructor(haConnection: HAConnection) {
		this.#haConnection = haConnection;
		haConnection.subscribeEvents((event: HassEvent) => {
			switch (event.event_type) {
				case "state_changed": {
					const stateChangedEvent = event as StateChangedEvent;
					const entityId = stateChangedEvent.data.entity_id;
					const entity = this.#entityRegistry.get(entityId);
					if (entity) {
						entity.hydrate(stateChangedEvent.data.new_state!);
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
	getEntity<EntityType extends BaseEntity<unknown>>(
		entityId: `${string}.${string}`,
	): Promise<EntityType | undefined>;
	async getEntity(entityId: string) {
		let entity = this.#entityRegistry.get(entityId);
		if (!entity) {
			const states = await getStates(this.#haConnection);
			const hassEntity = states.find((state) => state.entity_id === entityId);
			if (hassEntity) {
				const [domain] = hassEntity.entity_id.split(".") as [
					Domain,
					...string[],
				];
				const EntityClass = DEFAULT_DOMAINS[domain] || UnknownEntity;
				entity = new EntityClass(this, hassEntity);
				this.#entityRegistry.set(entityId, entity);
				entity.hydrate(hassEntity);
			}
		}
		return entity;
	}

	callAction<T = unknown>(
		domain: Domain | string,
		service: string,
		params: CallActionParams | undefined,
		result: true,
	): Promise<T>;
	callAction(
		domain: Domain | string,
		service: string,
		params?: CallActionParams,
		result?: boolean,
	): Promise<void>;
	async callAction<T = unknown>(
		domain: Domain | string,
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
