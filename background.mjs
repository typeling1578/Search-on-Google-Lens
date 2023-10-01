import generateRandomString from "./generateRandomString.mjs";
import fetchPlus from "./fetchPlus.mjs";

if (!window.browser) {
    window.browser = chrome;
}

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
    browser.tabs.sendMessage(tab.id, { type: "load-start" });

    const url_obj = new URL(tab.url);

    const image_data = await new Promise(resolve => {
        fetchPlus(image_url, {
            headers: {
                "Referer": url_obj.href,
                "Origin": url_obj.origin,
            }
        }).then(res => {
            if (res.status === 200) {
                return res.blob();
            } else {
                throw new Error(`${res.status} ${res.statusText}`);
            }
        }).then(data =>
            resolve(data)
        ).catch(e => {
            browser.tabs.sendMessage(tab.id, { type: "image-get-error" });
            throw e;
        });
    });
    // TODO: ほんとに画像データかどうか、SVGなら変換させる
    browser.tabs.sendMessage(tab.id, { type: "image-get-end" });

    let image_data_form = new FormData();
    image_data_form.set("encoded_image", image_data);
    image_data_form.set("image_url", `https://${generateRandomString(12)}.com/images/${generateRandomString(12)}`); // Send fake URL
    image_data_form.set("sbisrc", "Chromium 98.0.4725.0 Windows");
    const data = await new Promise(resolve => {
        fetch(`https://lens.google.com/upload?ep=ccm&s=&st=${generateRandomString(12)}`, {
            method: "POST",
            body: image_data_form,
        }).then(res => {
            if (res.status === 200) {
                return res.text();
            } else {
                throw new Error(`${res.status} ${res.statusText}`);
            }
        }).then(data =>
            resolve(data)
        ).catch(e => {
            browser.tabs.sendMessage(tab.id, { type: "google-post-error" });
            throw e;
        });
    });

    const doc = (new DOMParser()).parseFromString(data, "text/html");
    const url = doc?.querySelector('meta[http-equiv="refresh"]')?.getAttribute("content")
                ?.replace(" ", "")?.split(";")?.filter(str => str.startsWith("url="))?.slice(-1)[0]?.slice(4);

    if (url) {
        browser.tabs.sendMessage(tab.id, { type: "google-post-end" });
        browser.tabs.create({ url: new URL(url, "https://lens.google.com").href , windowId: tab.windowId, openerTabId: tab.id });
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
    contexts: ["image"]
});

browser.contextMenus.onClicked.addListener(function (info, tab) {
    switch (info.menuItemId) {
        case "image_right_click_selection":
            search_on_google_lens(info.srcUrl, tab);
            break;
    }
});

browser.runtime.onMessage.addListener(function (message, sender) {
    switch (message.type) {
        case "send-image":
            search_on_google_lens(message.src, sender.tab);
            break;
    }
});
