import { parseJSON } from "date-fns";
import type { Context, HassEntity } from "home-assistant-js-websocket";
import { States } from "../../const";
import type { Connection } from "../../net/Connection";
import { type Domain, Domains } from "../types";
export const DOMAIN_NAMES = new Set(Object.values(Domains));

type ListenerOptions = {
	stateOnly?: boolean;
};

type EntityListener<T extends BaseEntity> = (
	state: T["state"],
	oldState: T["state"],
) => void;

const nextTickCallbacks: (() => void)[] = [];

const nextTick =
	process?.nextTick ??
	((fct: (...args: unknown[]) => void, ...args: unknown[]) =>
		window?.requestAnimationFrame(() => fct(...args)));

const enqueueCallback = (callback: (...args: unknown[]) => void) => {
	nextTickCallbacks.push(callback);
	if (nextTickCallbacks.length === 1) {
		nextTick(() => {
			let listener: (typeof nextTickCallbacks)[number] | undefined;
			// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
			while ((listener = nextTickCallbacks.shift())) {
				listener();
			}
		});
	}
};

export abstract class BaseEntity<
	StateType = unknown,
	FeatureType extends number = number,
> {
	static readonly domain: Domain;

	readonly id: string;

	#domain: Domain;
	#idOnly: string;

	#connection: Connection;
	#listeners: Map<EntityListener<BaseEntity<unknown>>, ListenerOptions>;
	protected rawEntity: HassEntity;

	readonly state!: StateType | States.UNAVAILABLE | States.UNKNOWN;

	readonly lastChanged!: Date;
	readonly lastUpdated!: Date;
	readonly context!: Context;

	constructor(conn: Connection, props: HassEntity) {
		const [domain, ...idOnly] = props.entity_id.split(".") as [
			Domain,
			...string[],
		];
		this.id = props.entity_id;
		this.#idOnly = idOnly.join(".");
		this.#connection = conn;
		this.#listeners = new Map();

		this.#domain = domain;

		this.rawEntity = props;
	}

	hydrate(hassEntity: HassEntity) {
		if (hassEntity.entity_id !== this.id) {
			throw new Error(
				`Mismatched entity IDs: expected ${this.id}, got ${hassEntity.entity_id}`,
			);
		}
		// console.log("Hydrating unknown entity", this.id, "with", hassEntity);
		const oldState = this.state;
		this.rawEntity = hassEntity;
		Object.assign(this, this.parseHassEntity(hassEntity));
		const newState = this.state;
		let dispatched = false;
		for (const [listener, options] of this.#listeners.entries()) {
			if (hassEntity.state !== oldState || !options.stateOnly) {
				enqueueCallback(() => listener(newState, oldState ?? States.UNKNOWN));
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
		this.#listeners.set(listener as EntityListener<BaseEntity<unknown>>, { stateOnly: true, ...options });
		return () => {
			this.#listeners.delete(listener as EntityListener<BaseEntity<unknown>>);
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
			this.#domain,
			action,
			{
				data,
				target: { entity_id: this.id },
			},
			result,
		);
	}

	isFeatureSupported(feature: FeatureType) {
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
		return `[${this.#domain}] ${this.#idOnly} => ${this.state}`;
	}
}

export class UnknownEntity extends BaseEntity {
	hydrate(hassEntity: HassEntity) {
		console.log("Hydrating unknown entity", this.id, "with", hassEntity);
		return super.hydrate(hassEntity);
	}
}
