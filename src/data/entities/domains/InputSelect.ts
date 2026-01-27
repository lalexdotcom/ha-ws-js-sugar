import { BaseEntity } from "../Entity";

export class InputSelect<T = string> extends BaseEntity<T> {
	get options() {
		return this.rawEntity.attributes.options as T[];
	}

	reload() {
		return this.callAction("reload");
	}

	select(option: T) {
		return this.callAction("select_option", { option });
	}

	setOptions(options: T[]) {
		return this.callAction("set_options", { options });
	}

	selectFirst() {
		return this.callAction("select_first");
	}

	selectLast() {
		return this.callAction("select_last");
	}

	selectNext(cycle = true) {
		return this.callAction("select_next", { cycle });
	}

	selectPrevious(cycle = true) {
		return this.callAction("select_previous", { cycle });
	}
}
