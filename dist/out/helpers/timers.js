"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Timers {
    static helpers;
    static getDefaultOptions(options) {
        const defaultOptions = {
            tickDelay: 300,
            timeout: 999999,
            onTick: null,
        };
        return {
            ...defaultOptions,
            ...options,
        };
    }
    static timeoutCheck(timeout) {
        const returnOb = { done: false };
        setTimeout(() => {
            returnOb.done = true;
        }, timeout);
        return returnOb;
    }
    static async resolvingTimer(resolver, _options) {
        const options = Timers.getDefaultOptions(_options);
        const timeoutTimer = Timers.timeoutCheck(options.timeout);
        return new Promise((res) => {
            const self = setInterval(() => {
                // use js's nasty conversion to make sure value is truthy
                const instance = resolver();
                if (options.onTick) {
                    options.onTick(instance);
                }
                if (!instance)
                    return;
                if (timeoutTimer.done) {
                    Timers.helpers.logger.error("Timer timed out!");
                }
                clearInterval(self);
                res(instance);
            }, options.tickDelay);
        });
    }
    static async waitForNonFalsey(check, onDefined, _options) {
        const options = Timers.getDefaultOptions(_options);
        onDefined(await Timers.resolvingTimer(check, options));
    }
}
exports.default = Timers;
