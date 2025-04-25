import Helpers from "./helpers";

export type CheckValueCallback<T> = () => T | null | undefined;
export type TimerCallback<T> = (val: T) => void;

export type TimerOptions = {
    tickDelay?: number;
    timeout?: number;
    onTick?: ((resolverValue: any) => void) | null;
};

export default class Timers {
    public static helpers: Helpers;

    private static getDefaultOptions(options?: TimerOptions): Required<TimerOptions> {
        const defaultOptions: Required<TimerOptions> = {
            tickDelay: 300,
            timeout: 999999,
            onTick: null,
        };

        return {
            ...defaultOptions,
            ...options,
        };
    }

    public static timeoutCheck(timeout: number) {
        const returnOb = { done: false };

        setTimeout(() => {
            returnOb.done = true;
        }, timeout);

        return returnOb;
    }

    public static async resolvingTimer<T>(
        resolver: CheckValueCallback<T | (undefined | null)>,
        _options: TimerOptions
    ) {
        const options = Timers.getDefaultOptions(_options);
        const timeoutTimer = Timers.timeoutCheck(options.timeout);

        return new Promise<T>((res) => {
            const self = setInterval(() => {
                // use js's nasty conversion to make sure value is truthy
                const instance = resolver();

                if (options.onTick) {
                    options.onTick(instance);
                }

                if (!instance) return;

                if (timeoutTimer.done) {
                    Timers.helpers.logger.error("Timer timed out!");
                }

                clearInterval(self);
                res(instance);
            }, options.tickDelay);
        });
    }

    public static async waitForNonFalsey<T>(
        check: CheckValueCallback<T>,
        onDefined: TimerCallback<T>,
        _options?: TimerOptions
    ) {
        const options = Timers.getDefaultOptions(_options);
        onDefined(await Timers.resolvingTimer(check, options));
    }
}
