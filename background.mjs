/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import generateRandomString from "./modules/generateRandomString.mjs";
import fetchPlus from "./modules/fetchPlus.mjs";
import addonSettings from "./modules/addonSettings.mjs";
import resizeImage from "./modules/resizeImage.mjs";
import remoteSettings from "./modules/remoteSettings.mjs";

if (!window.browser) {
    window.browser = chrome;
}

const settings = new addonSettings();
await settings.init();

const settings_remote = new remoteSettings();
await settings_remote.init();

// change user-agent
browser.webRequest.onBeforeSendHeaders.addListener(
    function(e) {
        e.requestHeaders.forEach(function (header) {
            if (header.name.toLowerCase() === "user-agent") {
                header.value = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4725.0 Safari/537.36";
            }
        });
        return { requestHeaders: e.requestHeaders };
    },
    { urls: ["https://lens.google.com/*"] },
    ["blocking", "requestHeaders"]
);

async function search_on_google_lens(image_url, tab) {
    browser.tabs.sendMessage(tab.id, {
        type: "load-start",
        thinking: image_url.startsWith(location.origin)
    });

    const image_url_obj = new URL(tab.url);

    const image_data = await fetchPlus(
            image_url,
            {
                headers: {
                    "Referer": image_url_obj.href,
                    "Origin": image_url_obj.origin,
                }
            }
        )
        .then(res => {
            if (res.status === 200) {
                return res.blob();
            } else {
                throw new Error(`${res.status} ${res.statusText}`);
            }
        })
        .then(data => data)
        .catch(e => {
            browser.tabs.sendMessage(tab.id, { type: "image-get-error" });
            throw e;
        });

    const image_data_processed = await resizeImage(
            image_data,
            {
                mode: "maxSize",
                maxWidth: 1000,
                maxHeight: 1000,
                forceEncode: true,
            }
        )
        .catch(e => {
            browser.tabs.sendMessage(tab.id, { type: "image-get-error" });
            throw e;
        });

    browser.tabs.sendMessage(tab.id, {
        type: "image-get-end",
        thinking: image_url.startsWith(location.origin)
    });

    const image_data_form = new FormData();
    image_data_form.set("encoded_image", image_data_processed);
    image_data_form.set("image_url", `https://${generateRandomString(12)}.com/images/${generateRandomString(12)}`); // Send fake URL
    image_data_form.set("sbisrc", "Chromium 98.0.4725.0 Windows");
    const result = await fetchPlus(
            `https://lens.google.com/upload?ep=ccm&s=&st=${generateRandomString(12)}`,
            {
                method: "POST",
                body: image_data_form,
                headers: {
                    "Origin": "https://lens.google.com",
                    "Referer": "https://lens.google.com/",
                }
            }
        )
        .then(res => {
            if (res.status === 200) {
                return res;
            } else {
                throw new Error(`${res.status} ${res.statusText}`);
            }
        })
        .then(data => data)
        .catch(e => {
            browser.tabs.sendMessage(tab.id, { type: "google-post-error" });
            throw e;
        });

    const url = result.url;
    if (url) {
        browser.tabs.sendMessage(tab.id, { type: "google-post-end" });
        browser.tabs.create({
            url: new URL(url, "https://lens.google.com").href,
            windowId: tab.windowId ?? undefined,
            openerTabId: tab.id ?? undefined,
            active: !settings.get("local", "newTabsLoadInBackground"),
        });
    } else {
        throw new Error(`URL is not included in the result`);
    }
}

browser.browserAction.onClicked.addListener(function () {
    browser.tabs.create({ url: browser.runtime.getURL("popup.html") });
});

browser.contextMenus.create({
    id: "image_right_click_selection",
    title: browser.i18n.getMessage("browserAction"),
    contexts: ["image"],
    targetUrlPatterns: ["*://*/*", `${location.origin}/*`]
});

browser.contextMenus.onClicked.addListener(function (info, tab) {
    console.log("[Background Scripts]", `context menus clicked: ${info.menuItemId}`);

    switch (info.menuItemId) {
        case "image_right_click_selection":
            search_on_google_lens(info.srcUrl, tab);
            break;
        default:
            break;
    }
});

browser.runtime.onMessage.addListener(function (message, sender) {
    console.log("[Background Scripts]", `message received: ${message.type}`);

    switch (message.type) {
        case "send-image":
            search_on_google_lens(message.src, sender.tab);
            break;
        default:
            break;
    }
});

class ContentScriptRegister {
    constructor(key, script_options) {
        this.key = key;
        this.script_options = script_options;
        this.registed = null;

        let wait = new Promise((resolve) => { resolve() });
        if (settings_remote.get(this.key)) {
            wait = this.#load();
        }

        settings_remote.addListener(async (settings_key, settings) => {
            await wait;
            if (this.key == settings_key) {
                if (settings[key]) {
                    await this.#load();
                } else {
                    this.#unload();
                }
            }
        });
    }
    async #load() {
        if (!this.registed) {
            this.registed = await browser.contentScripts.register(this.script_options);
        }
    }
    #unload() {
        if (this.registed) {
            this.registed.unregister();
            this.registed = null;
        }
    }
}

new ContentScriptRegister(
    "injectTouchStartEventBlockingScript",
    {
        js: [{ file: "/injects/touch_start_event_blocking.js" }],
        matches: ["*://lens.google.com/*"],
        runAt: "document_start",
    },
);

new ContentScriptRegister(
    "injectPreventDetectFirefoxBrowserScript",
    {
        js: [{ file: "/injects/prevent_detect_firefox_browser.js" }],
        matches: ["*://lens.google.com/*"],
        runAt: "document_start",
    },
);
