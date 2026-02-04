import type { HassEntity } from "home-assistant-js-websocket";
import type { Entity } from "../entities";
import type { Connection } from "./Connection";

export type EntityName = `${string}.${string}`;

export type ActionTarget = (
	| {
			entity?: Entity | Entity[];
	  }
	| {
			entityId?: string | string[];
	  }
) & {
	deviceId?: string | string[];
} & {
	areaId?: string | string[];
} & {
	floorId?: string | string[];
} & {
	labelId?: string | string[];
};

export type ActionRegistry = Record<string, readonly string[]>;

export type RegistryActionName<AR extends ActionRegistry> = {
	[K in keyof AR]: `${K extends symbol ? never : K}.${AR[K][number]}`;
}[keyof AR];

export type DomainEntityClass = {
	new (conn: Connection, props: HassEntity): Entity;
	readonly domain: string;
};

export type DomainRegistry = Record<string, DomainEntityClass>;
