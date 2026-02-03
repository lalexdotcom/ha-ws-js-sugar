import {
	createConnection as createHAConnection,
	createLongLivedTokenAuth,
} from "home-assistant-js-websocket";
import type { Connection } from "./connection/Connection";
import { SocketConnection } from "./connection/SocketConnection";
import type {
	ActionRegistry,
	DomainEntityClass,
	DomainRegistry,
	EntityName,
} from "./connection/types";
import type { CoreRegisteredDomains } from "./const";

export type CreateConnectionOptions = {
	host: string;
	token: string;
};

export const createConnection = <
	E extends EntityName = EntityName,
	AR extends ActionRegistry = Record<string, never>,
>(
	options: CreateConnectionOptions,
) => {
	type CreatedConnection = Connection<
		{ [K in (typeof CoreRegisteredDomains)[number] as K["domain"]]: K },
		E,
		AR
	>;
	let connectionResolve!: (connection: CreatedConnection) => void;

	const connectionPromise = new Promise<
		Parameters<typeof connectionResolve>[0]
	>((res) => {
		connectionResolve = res;
	});

	if ("host" in options && "token" in options) {
		const auth = createLongLivedTokenAuth(options.host, options.token);
		createHAConnection({ auth }).then((haConnection) => {
			connectionResolve(
				new SocketConnection<
					{ [K in (typeof CoreRegisteredDomains)[number] as K["domain"]]: K },
					E,
					AR
				>(haConnection),
			);
		});
	}

	type EhancedConnectionPromise<DR extends DomainRegistry> = Promise<
		Connection<DR, E, AR>
	> & {
		registerDomains: <DEC extends DomainEntityClass[]>(
			classes: DEC,
		) => Promise<
			Connection<
				DR & {
					[K in (typeof CoreRegisteredDomains)[number] as K["domain"]]: K;
				},
				E,
				AR
			>
		>;
	};

	return Object.assign(connectionPromise, {
		registerDomains<DomainEntityClasses extends DomainEntityClass[]>(
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
				conn.registerDomain(classes);
				return conn as Connection<
					{
						[K in DomainEntityClasses[number] as K["domain"]]: K;
					} & {
						[K in (typeof CoreRegisteredDomains)[number] as K["domain"]]: K;
					},
					E,
					AR
				>;
			});
		},
	});
};

export { Connection } from "./connection/Connection";
export { Entity } from "./entities";

export type { ActionRegistry, DomainEntityClass, DomainRegistry, EntityName };
