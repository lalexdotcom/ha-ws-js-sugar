import type { Entity } from "../entities";
import type { CoreRegisteredDomains } from "./const";

// export type DomainRegistry = {
// 	[K in (typeof RegisteredDomains)[number] as K["domain"]]: K;
// };

export type ActionTarget = {
	entity?: Entity | Entity[];
};
