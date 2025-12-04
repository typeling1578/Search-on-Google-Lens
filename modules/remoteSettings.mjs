/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import fetchPlus from "./fetchPlus.mjs";

if (!window.browser) {
    window.browser = chrome;
}

const DEFAULT_SETTINGS = {
    "injectTouchStartEventBlockingScript": true,
    "injectPreventDetectFirefoxBrowserScript": false,
    "changeLensGoogleComUserAgent": false,
    "rewriteLensGoogleComV3ApiRefererAndOrigin": false,
};

export default class {
    #remote;

    constructor() {
        this.initializing = false;
        this.initialized = false;
        this._listeners = [];

        this.#remote = [];
    }
    async init() {
        if (this.initializing || this.initialized) return;
        this.initializing = true;

        this.#remote = Object.assign({}, DEFAULT_SETTINGS);

        await this.sync();

        this.initialized = true;
    }
    async sync() {
        if (!this.initializing && !this.initialized) return;

        const result = await fetchPlus(
            "https://api-static.typeling1578.dev/addons/search-on-google-lens/remote-settings.json",
            {
                headers: {
                    "User-Agent": `Search-on-Google-Lens/${browser.runtime.getManifest().version}`
                }
            }
        );
        if (!result.ok) {
            return false;
        }

        let settings;
        try {
            settings = await result.json();
        } catch (e) {
            console.error(e);
            return false;
        }

        const old_remote = Object.assign({}, this.#remote);
        this.#remote = Object.assign({}, DEFAULT_SETTINGS, settings);

        if (this.initialized) {
            const key_sets = new Set();

            for (const key of Object.keys(old_remote)) {
                key_sets.add(key);
            }
            for (const key of Object.keys(this.#remote)) {
                key_sets.add(key);
            }

            for (const key of key_sets) {
                if (old_remote[key] !== this.#remote[key]) {
                    for (const listener of this._listeners) {
                        listener.callback(key, this.#remote);
                    }
                }
            }
        }

        return true;
    }
    get(key) {
        return this.#remote[key];
    }
    getAll() {
        return Object.assign({}, this.#remote);
    }
    addListener(callback) {
        if (!this.initialized) throw new Error("must be initialized");

        this._listeners.push({
            callback: callback,
        });
    }
    removeListener(callback) {
        if (!this.initialized) throw new Error("must be initialized");

        this._listeners =
            this._listeners.filter(listener => listener.callback !== callback);
    }
}
