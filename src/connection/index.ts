import {
	createConnection as createHAConnection,
	createLongLivedTokenAuth,
	type HassEntity,
} from "home-assistant-js-websocket";
import type { Entity, UnknownEntity } from "../entities";
import type { BaseConnection } from "./BaseConnection";
import type { CoreRegisteredDomains } from "./const";
import { SocketConnection } from "./SocketConnection";
import type { ActionTarget } from "./types";

type CreateConnectionOptions = { domains?: DomainEntityClass } & (
	| {
			host: string;
			token: string;
	  }
	| { type: "subprocess" }
);

type DomainEntityClass = {
	new (conn: BaseConnection, props: HassEntity): Entity;
	readonly domain: string;
};

export interface Connection<
	Domains extends Record<string, DomainEntityClass> = Record<string, never>,
	Entities extends string = string,
	Actions extends `${string}.${string}` = `${string}.${string}`,
> {
	// register<DOMAIN_CLASSES extends DomainEntityClass[]>(
	// 	classes: DOMAIN_CLASSES,
	// ): Connection<
	// 	{
	// 		[K in DOMAIN_CLASSES[number] as K["domain"]]: K;
	// 	} & Domains,
	// 	Entities,
	// 	Actions
	// >;

	getEntity<ENTITY_ID extends Entities>(
		entityId: ENTITY_ID,
	): Promise<
		ENTITY_ID extends `${infer D}.${string}`
			? D extends keyof Domains
				? InstanceType<Domains[D]>
				: UnknownEntity
			: undefined
	>;
	getEntity<ENTITY_ID extends `${string}.${string}`>(
		entityId: ENTITY_ID,
	): Promise<
		ENTITY_ID extends `${infer D}.${string}`
			? D extends keyof Domains
				? InstanceType<Domains[D]>
				: UnknownEntity
			: undefined
	>;
	getEntity<EntityType extends Entity = UnknownEntity>(
		entityId: `${string}.${string}`,
	): Promise<EntityType | undefined>;

	callAction<T = unknown>(
		action: Actions,
		target: ActionTarget | undefined,
		data: Record<string, unknown> | undefined,
		result: true,
	): Promise<T>;
	callAction(
		action: Actions,
		target?: ActionTarget,
		data?: Record<string, unknown>,
		result?: boolean,
	): Promise<void>;
}

export const createConnection = <
	Entities extends `${string}.${string}` = `${string}.${string}`,
	Actions extends `${string}.${string}` = `${string}.${string}`,
>(
	options: CreateConnectionOptions,
) => {
	let connectionResolve: (
		connection: Connection<
			{ [K in (typeof CoreRegisteredDomains)[number] as K["domain"]]: K },
			Entities,
			Actions
		>,
	) => void;
	const connectionPromise = new Promise<
		Parameters<typeof connectionResolve>[0]
	>((res) => {
		connectionResolve = res;
	});
	let connection: BaseConnection | undefined;
	if ("host" in options && "token" in options) {
		const auth = createLongLivedTokenAuth(options.host, options.token);
		createHAConnection({ auth }).then((haConnection) => {
			connection = new SocketConnection(haConnection);
			connectionResolve(
				connection as Connection<
					{ [K in (typeof CoreRegisteredDomains)[number] as K["domain"]]: K },
					Entities,
					Actions
				>,
			);
		});
		// connection = new SocketConnection(haConnection);
	}

	type EhancedConnectionPromise<
		ConnectionDomains extends { [k: string]: DomainEntityClass } = {
			[k: string]: DomainEntityClass;
		},
	> = Promise<Connection<ConnectionDomains, Entities, Actions>> & {
		register: <RegisteringDomains extends DomainEntityClass[]>(
			classes: RegisteringDomains,
		) => Promise<
			Connection<
				{
					[K in RegisteringDomains[number] as K["domain"]]: K;
				} & ConnectionDomains,
				Entities,
				Actions
			>
		>;
	};

	return Object.assign(connectionPromise, {
		register<DomainEntityClasses extends DomainEntityClass[]>(
			this: EhancedConnectionPromise<{
				[K in (typeof CoreRegisteredDomains)[number] as K["domain"]]: K;
			}>,
			classes: DomainEntityClasses,
		) {
			return this.then((conn) => {
				console.debug(
					"Registering domain classes",
					classes.map((c) => c.domain),
				);
				(conn as BaseConnection).registerDomainClasses(classes);
				return conn as unknown as Connection<
					{
						[K in DomainEntityClasses[number] as K["domain"]]: K;
					} & {
						[K in (typeof CoreRegisteredDomains)[number] as K["domain"]]: K;
					},
					Entities,
					Actions
				>;
			});
		},
	});
};
