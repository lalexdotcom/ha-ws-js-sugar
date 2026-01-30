import type { Entity } from "../entities";

// export type DomainRegistry = {
// 	[K in (typeof RegisteredDomains)[number] as K["domain"]]: K;
// };

export type ActionTarget = {
	entity?: Entity | Entity[];
};
