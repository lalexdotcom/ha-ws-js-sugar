import {
	createConnection as createHAConnection,
	createLongLivedTokenAuth,
} from "home-assistant-js-websocket";
import type { Connection } from "./connection/Connection";
import { SocketConnection } from "./connection/SocketConnection";
import type {
	ActionRegistry,
	ActionTarget,
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
export { CoreRegisteredDomains } from "./const";
export { Entity, UnknownEntity } from "./entities";

export { Alarm } from "./entities/domains/Alarm";
export { BinarySensor } from "./entities/domains/BinarySensor";
export { Button } from "./entities/domains/Button";
export { Climate } from "./entities/domains/Climate";
export { Cover } from "./entities/domains/Cover";
export {
	DeviceTracker,
	type GPSDeviceTracker,
	type RouterDeviceTracker,
} from "./entities/domains/DeviceTracker";
export { InputBoolean } from "./entities/domains/InputBoolean";
export { InputButton } from "./entities/domains/InputButton";
export { InputDatetime } from "./entities/domains/InputDateTime";
export { InputNumber } from "./entities/domains/InputNumber";
export { InputSelect } from "./entities/domains/InputSelect";
export { Light } from "./entities/domains/Light";
export { MediaPlayer } from "./entities/domains/MediaPlayer";
export { Sensor } from "./entities/domains/Sensor";
export { Switch } from "./entities/domains/Switch";
export { WaterHeater } from "./entities/domains/WaterHeater";

export type {
	ActionRegistry,
	DomainEntityClass,
	DomainRegistry,
	EntityName,
	ActionTarget,
};
