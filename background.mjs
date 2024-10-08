import generateRandomString from "./modules/generateRandomString.mjs";
import fetchPlus from "./modules/fetchPlus.mjs";
import addonSettings from "./modules/addonSettings.mjs";
import resizeImage from "./modules/resizeImage.mjs";

if (!window.browser) {
    window.browser = chrome;
}

const settings = new addonSettings();
await settings.init();

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
