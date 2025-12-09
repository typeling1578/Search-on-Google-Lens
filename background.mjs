/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import generateRandomString from "./modules/generateRandomString.mjs";
import fetchPlus from "./modules/fetchPlus.mjs";
import addonSettings from "./modules/addonSettings.mjs";
import resizeImage from "./modules/resizeImage.mjs";

if (!window.browser) {
    window.browser = chrome;
}

const settings = new addonSettings();
await settings.init();

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

    browser.tabs.create({
        url: `${browser.runtime.getURL("/post_to_lens.html")}?image_data_url=${encodeURIComponent(image_data_processed_dataurl)}`,
        windowId: tab.windowId ?? undefined,
        openerTabId: tab.id ?? undefined,
        active: !settings.get("local", "newTabsLoadInBackground"),
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
