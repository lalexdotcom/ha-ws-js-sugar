import { parseJSON } from "date-fns";
import type { Context, HassEntity } from "home-assistant-js-websocket";
import type { BaseConnection } from "../connection/BaseConnection";
import { callOnNextTick } from "../utils";
import { State } from "./types";

// export const DOMAIN_NAMES = new Set(Object.values(Domains));

type ListenerOptions = {
	stateOnly?: boolean;
};

type EntityListener<T extends Entity> = (
	state: T["state"],
	oldState: T["state"],
) => void;

export abstract class Entity<StateType = unknown> {
	readonly id: string;

	#connection: BaseConnection;
	#listeners: Map<EntityListener<Entity<unknown>>, ListenerOptions>;
	protected rawEntity: HassEntity;

	readonly state!: StateType | State.UNAVAILABLE | State.UNKNOWN;

	readonly lastChanged!: Date;
	readonly lastUpdated!: Date;
	readonly context!: Context;

	constructor(conn: BaseConnection, props: HassEntity) {
		const [domain] = props.entity_id.split(".") as [string, ...string[]];
		if (this.domain && this.domain !== domain) {
			throw new Error(
				`Mismatched domain for entity ${props.entity_id}: expected ${this.domain}, got ${domain}`,
			);
		}

		this.id = props.entity_id;
		this.#connection = conn;
		this.#listeners = new Map();

		this.rawEntity = props;
	}

	protected get domain() {
		// biome-ignore lint/suspicious/noExplicitAny: <kinda hack>
		return (this.constructor as any).domain;
	}

	hydrate(hassEntity: HassEntity) {
		if (hassEntity.entity_id !== this.id) {
			throw new Error(
				`Mismatched entity IDs: expected ${this.id}, got ${hassEntity.entity_id}`,
			);
		}
		const oldState = this.state;
		this.rawEntity = hassEntity;
		Object.assign(this, this.parseHassEntity(hassEntity));
		const newState = this.state;
		let dispatched = false;
		for (const [listener, options] of this.#listeners.entries()) {
			if (hassEntity.state !== oldState || !options.stateOnly) {
				callOnNextTick(() => listener(newState, oldState ?? State.UNKNOWN));
				dispatched = true;
			}
		}
		return dispatched;
		// console.log(this.id, "is now", this.state);
	}

	protected parseHassEntity(hassEntity: HassEntity) {
		return {
			state: this.parseState(hassEntity),
			lastChanged: parseJSON(hassEntity.last_changed),
			lastUpdated: parseJSON(hassEntity.last_updated),
			context: hassEntity.context,
		};
	}

	protected parseState(entity: HassEntity): StateType {
		return entity.state as StateType;
	}

	addListener(
		listener: EntityListener<typeof this>,
		options?: ListenerOptions,
	) {
		this.#listeners.set(listener as EntityListener<Entity<unknown>>, {
			stateOnly: true,
			...options,
		});
		return () => {
			this.#listeners.delete(listener as EntityListener<Entity<unknown>>);
		};
	}

	callAction<T = unknown>(
		action: string,
		data: Record<string, unknown> | undefined,
		result: true,
	): Promise<T>;
	callAction(action: string, data?: Record<string, unknown>): Promise<void>;
	callAction(action: string, data?: Record<string, unknown>, result = false) {
		return this.#connection.callAction(
			`${this.domain}.${action}`,
			{ entity: this },
			data,
			result,
		);
	}

	protected _isFeatureSupported(feature: number) {
		const supportedFeatures = this.rawEntity.attributes.supported_features;
		return (
			supportedFeatures !== undefined &&
			(supportedFeatures & feature) === feature
		);
	}

	get friendlyName() {
		return this.rawEntity.attributes.friendly_name;
	}

	toString() {
		return `<${this.constructor.name} id=${this.id} state=${this.state}>`;
	}

	inspect() {
		return `[${this.id} => ${this.state}`;
	}
}

export class UnknownEntity extends Entity {
	static domain = null;
	hydrate(hassEntity: HassEntity) {
		console.log("Hydrating unknown entity", this.id, "with", hassEntity);
		return super.hydrate(hassEntity);
	}
}
