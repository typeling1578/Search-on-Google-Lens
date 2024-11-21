/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import generateRandomString from "./modules/generateRandomString.mjs";
import fetchPlus from "./modules/fetchPlus.mjs";
import addonSettings from "./modules/addonSettings.mjs";
import resizeImage from "./modules/resizeImage.mjs";
import remoteSettings from "./modules/remoteSettings.mjs";
import ContentScriptRegister from "./modules/contentScriptRegister.mjs";

if (!window.browser) {
    window.browser = chrome;
}

const settings = new addonSettings();
await settings.init();

const settings_remote = new remoteSettings();
await settings_remote.init();
setInterval(async () => await settings_remote.sync(), 30 * 60 * 1000); // 30 minutes

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

browser.webRequest.onBeforeSendHeaders.addListener(
    function(e) {
        let requestHeaders = e.requestHeaders;

        requestHeaders =
            requestHeaders.filter(requestHeader =>
                requestHeader.name.toLowerCase() !== "Origin".toLowerCase()
            );
        requestHeaders =
            requestHeaders.filter(requestHeader =>
                requestHeader.name.toLowerCase() !== "Referer".toLowerCase()
            );

        requestHeaders.push({
            name: "Referer",
            value: "https://lens.google.com/"
        });

        requestHeaders.push({
            name: "Origin",
            value: "https://lens.google.com"
        });

        return { requestHeaders }
    },
    { urls: ["https://lens.google.com/v3/*"] },
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

    const image_data_processed_dataurl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(image_data_processed);
    });

    browser.tabs.sendMessage(tab.id, {
        type: "open-new-tab",
        data_url: image_data_processed_dataurl,
    });

    browser.tabs.sendMessage(tab.id, { type: "google-post-end" });
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

const touchStartEventBlockingScriptRegister = new ContentScriptRegister(
    {
        js: [{ file: "/injects/touch_start_event_blocking.js" }],
        matches: ["*://lens.google.com/*"],
        runAt: "document_start",
    },
);
const preventDetectFirefoxBrowser = new ContentScriptRegister(
    {
        js: [{ file: "/injects/prevent_detect_firefox_browser.js" }],
        matches: ["*://lens.google.com/*"],
        runAt: "document_start",
    },
);

async function onRemoteSettingsChange(key, settings) {
    if (key == "injectTouchStartEventBlockingScript") {
        if (settings[key]) {
            console.log("Load \"touch_start_event_blocking.js\"");
            await touchStartEventBlockingScriptRegister.load();
        } else {
            console.log("Unload \"touch_start_event_blocking.js\"");
            await touchStartEventBlockingScriptRegister.unload();
        }
    }
    if (key == "injectPreventDetectFirefoxBrowserScript") {
        if (settings[key]) {
            console.log("Load \"prevent_detect_firefox_browser.js\"");
            await preventDetectFirefoxBrowser.load();
        } else {
            console.log("Unload \"prevent_detect_firefox_browser.js\"");
            await preventDetectFirefoxBrowser.unload();
        }
    }
}
settings_remote.addListener(onRemoteSettingsChange);
for (const key of Object.keys(settings_remote.getAll())) { // init
    onRemoteSettingsChange(key, settings_remote.getAll());
}
