/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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

        this.local = await new Promise(resolve => browser.storage.local.get(null, (items) => resolve(items)));
        this.sync = await new Promise(resolve => browser.storage.sync.get(null, (items) => resolve(items)));
        try {
            this.managed = await new Promise(resolve => browser.storage.managed.get(null, (items) => resolve(items)));
        } catch (e) {}

        browser.storage.onChanged.addListener(async (changes, areaName) => {
            if (!["local", "sync"].includes(areaName)) return;

            this[areaName] = await new Promise(resolve => browser.storage[areaName].get(null, (items) => resolve(items)));
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
