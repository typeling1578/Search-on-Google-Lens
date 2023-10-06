if (!window.browser) {
    window.browser = chrome;
}

const LOCAL_DEFAULT_SETTINGS = {
    "newTabsLoadInBackground": false,
};

export default class {
    constructor() {
        this.initialized = false;
        this._listeners = [];

        this.local = {};
        this.sync = {};
        this.managed = {};
    }
    async init() {
        if (this.initialized) return;
        this.initialized = true;

        this.local = await browser.storage.local.get();
        this.sync = await browser.storage.sync.get();
        try {
            this.managed = await browser.storage.managed.get();
        } catch (e) {}

        browser.storage.onChanged.addListener(async (changes, areaName) => {
            if (!["local", "sync"].includes(areaName)) return;

            this[areaName] = await browser.storage[areaName].get();
            for (const listener of this._listeners) {
                if (listener.type == areaName) {
                    listener.callback(areaName, changes, this[areaName]);
                }
            }
        });

        for (const key of Object.keys(LOCAL_DEFAULT_SETTINGS)) {
            if (this.get("local", key) === undefined) {
                this.set("local", key, LOCAL_DEFAULT_SETTINGS[key]);
            }
        }
    }
    get(areaName, key) {
        if (!this.initialized) throw new Error("must be initialized");
        return this[areaName ?? "local"][key];
    }
    async set(areaName, key, value) {
        if (!this.initialized) throw new Error("must be initialized");
        let config = {};
        config[key] = value;
        await browser.storage[areaName ?? "local"].set(config);
    }
    addListener(callback, config) {
        if (!this.initialized) throw new Error("must be initialized");

        this._listeners.push({
            type: config.type ?? "local",
            callback: callback,
        });
    }
    removeListener(callback) {
        if (!this.initialized) throw new Error("must be initialized");

        this._listeners =
            this._listeners.filter(listener => listener.callback !== callback);
    }
}
