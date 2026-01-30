const nextTickCallbacks: (() => void)[] = [];

/**
 * Schedules a callback to be executed in the next tick.
 * Uses Node.js `process.nextTick` if available, otherwise falls back to `requestAnimationFrame`.
 * @param fct - The function to execute
 * @param args - Arguments to pass to the function
 */
const universalNextTick =
	process?.nextTick ??
	((fct: (...args: unknown[]) => void, ...args: unknown[]) =>
		window?.requestAnimationFrame(() => fct(...args)));

/**
 * Enqueues a callback to be executed asynchronously.
 * Batches multiple callbacks and executes them all in a single tick using `universalNextTick`.
 * @param callback - The callback function to enqueue
 */
export const callOnNextTick = (callback: (...args: unknown[]) => void) => {
	nextTickCallbacks.push(callback);
	if (nextTickCallbacks.length === 1) {
		universalNextTick(() => {
			let callback: (typeof nextTickCallbacks)[number] | undefined;
			while ((callback = nextTickCallbacks.shift())) {
				callback();
			}
		});
	}
};
