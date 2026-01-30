import type { HassEntity } from "home-assistant-js-websocket";
import { Entity } from "..";

export const InputTextModes = {
	TEXT: "text",
	PASSWORD: "password",
};

export type InputTextMode =
	(typeof InputTextModes)[keyof typeof InputTextModes];

export class InputText extends Entity<string> {
	#pattern?: RegExp;

	protected parseHassEntity(hassEntity: HassEntity) {
		this.#pattern =
			hassEntity.attributes.pattern &&
			new RegExp(hassEntity.attributes.pattern);
		return super.parseHassEntity(hassEntity);
	}

	get pattern() {
		return this.#pattern;
	}

	get mode() {
		return this.rawEntity.attributes.mode as InputTextMode;
	}

	isPassword() {
		return this.rawEntity.attributes.mode === InputTextModes.PASSWORD;
	}

	set(value: string) {
		if (this.#pattern && !this.#pattern?.test(value)) {
			throw new Error(
				`Value doesn't match pattern ${this.rawEntity.attributes.pattern}`,
			);
		}
		return this.callAction("set_value", { value });
	}

	reload() {
		return this.callAction("reload");
	}
}
