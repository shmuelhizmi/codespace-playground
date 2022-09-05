export default class Emitter<T extends Record<string, ((...args: any[]) => void)>> {
    private listeners: Partial<{
        [K in keyof T]: T[K][]
    }> = {};

    on<K extends keyof T>(event: K, listener: T[K]) {
        this.listeners[event] = this.listeners[event] || [];
        this.listeners[event]!.push(listener);
        return {
            remove: () => {
                this.off(event, listener);
            }
        }
    }

    emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void {
        const listener = this.listeners[event];
        if (listener) {
            listener.forEach((listener) => listener(...args));
        }
    }

    off<K extends keyof T>(event: K, listener: T[K]): void {
        const listeners = this.listeners[event];
        if (listeners) {
            listeners.splice(listeners.indexOf(listener), 1);
        }
    }

    get call() {
        return new Proxy({}, {
            get: (target, property) => {
                return (...args: any[]) => {
                    this.emit(property as keyof T, ...args as Parameters<T[keyof T]>);
                }
            }
        }) as T;
    }

    get listen() {
        return new Proxy({}, {
            get: (target, property) => {
                return (listener: T[keyof T]) => {
                    this.on(property as keyof T, listener);
                }
            }
        }) as {
            [K in keyof T]: (listener: T[K]) => () => void
        }
    }
}