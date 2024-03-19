import generateRandomString from "./modules/generateRandomString.mjs";
import fetchPlus from "./modules/fetchPlus.mjs";
import addonSettings from "./modules/addonSettings.mjs";
import decodeHTMLEntities from "./modules/decodeHTMLEntities.mjs";

//@if BROWSER="chromium"
const browser = chrome;
//@endif

//@if BROWSER="firefox"
//@include modules/resizeImage.inc.mjs
//@endif

(async () => {
    const settings = new addonSettings();
    await settings.init();

//@if BROWSER="firefox"
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
//@endif

    async function search_on_google_lens(image_url, tab) {
        browser.tabs.sendMessage(tab.id, {
            type: "load-start",
            thinking: image_url.startsWith(location.origin)
        });

//@if BROWSER="firefox"
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
//@endif
//@if BROWSER="chromium"
        const image_data_processed = await browser.tabs.sendMessage(tab.id, { type: "request-image-processing-cs", image_url: image_url })
            .then(message => {
                switch (message.type) {
                    case "request-image-processing-cs-end":
                        return fetch(message.image_processed_url)
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
                            })
                        break;
                    case "request-image-processing-cs-error":
                        browser.tabs.sendMessage(tab.id, { type: "image-get-error" });
                        throw new Error("request-image-processing-cs-error");
                        break;
                }
            })
//@endif

        browser.tabs.sendMessage(tab.id, {
            type: "image-get-end",
            thinking: image_url.startsWith(location.origin)
        });

        const image_data_form = new FormData();
        image_data_form.set("encoded_image", image_data_processed);
        image_data_form.set("image_url", `https://${generateRandomString(12)}.com/images/${generateRandomString(12)}`); // Send fake URL
        image_data_form.set("sbisrc", "Chromium 98.0.4725.0 Windows");
        const data = await fetch(
                `https://lens.google.com/upload?ep=ccm&s=&st=${generateRandomString(12)}`,
                {
                    method: "POST",
                    body: image_data_form,
                }
            )
            .then(res => {
                if (res.status === 200) {
                    return res.text();
                } else {
                    throw new Error(`${res.status} ${res.statusText}`);
                }
            })
            .then(data => data)
            .catch(e => {
                browser.tabs.sendMessage(tab.id, { type: "google-post-error" });
                throw e;
            });

        const matches = data.match(/<meta.*?http-equiv="refresh".*?content="(.*?)".*?>/s);
        if (!matches || !matches[1]) {
            browser.tabs.sendMessage(tab.id, { type: "google-post-error" });
            throw new Error(`URL is not included in the result`);
        }
        const url = decodeHTMLEntities(matches[1]).replace(" ", "").split(";").filter(str => str.startsWith("url=")).slice(-1)[0]?.slice(4);

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

    browser.action.onClicked.addListener(function () {
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
})();