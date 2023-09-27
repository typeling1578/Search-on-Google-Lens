var targetPage = "https://lens.google.com/*";
var ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4725.0 Safari/537.36";
function rewriteUserAgentHeader(e) {
    e.requestHeaders.forEach(function (header) {
        if (header.name.toLowerCase() === "user-agent") {
            header.value = ua;
        }
    });
    return { requestHeaders: e.requestHeaders };
}
chrome.webRequest.onBeforeSendHeaders.addListener(
    rewriteUserAgentHeader,
    { urls: [targetPage] },
    ["blocking", "requestHeaders"]
);

function generateRandomString(n) {
    var s = "abcdefghijklmnopqrstuvwxyz0123456789";
    var str = "";
    for (var i = 0; i < n; i++) {
        str += s[Math.floor(Math.random() * s.length)];
    }
    return str;
}

async function search_on_google_lens(image_url, tab) {
    chrome.tabs.sendMessage(tab.id, "load-start");

    let image_data_request_id = generateRandomString(12);

    let listener = function(details) {
        let requestHeaders = details.requestHeaders;

        for (let requestHeader of requestHeaders) {
            if (requestHeader.name == "Search-on-Google-Lens-Request-Id" &&
                requestHeader.value == image_data_request_id) {
                browser.webRequest.onBeforeSendHeaders.removeListener(listener);

                requestHeaders =
                    requestHeaders.filter(requestHeader =>
                        requestHeader.name !== "Search-on-Google-Lens-Request-Id" &&
                        requestHeader.name !== "Referer" &&
                        requestHeader.name !== "Origin"
                    );

                let url_obj = new URL(tab.url);

                requestHeaders.push({
                    name: "Referer",
                    value: url_obj.href,
                });

                requestHeaders.push({
                    name: "Origin",
                    value: url_obj.origin
                });

                return { requestHeaders }
            }
        }
    }
    browser.webRequest.onBeforeSendHeaders.addListener(
        listener,
        { urls: [image_url] },
        ["blocking", "requestHeaders"]
    );

    let image_data = await new Promise(resolve => {
        fetch(image_url, {
            headers: {
                "Search-on-Google-Lens-Request-Id": image_data_request_id
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
            browser.webRequest.onBeforeSendHeaders.removeListener(listener);
            chrome.tabs.sendMessage(tab.id, "image-get-error");
            throw e;
        });
    });
    // TODO: ほんとに画像データかどうか、SVGなら変換させる
    chrome.tabs.sendMessage(tab.id, "image-get-end");

    let image_data_form = new FormData();
    image_data_form.set("encoded_image", image_data);
    image_data_form.set("image_url", `https://${generateRandomString(12)}.com/images/${generateRandomString(12)}`); // Send fake URL
    image_data_form.set("sbisrc", "Chromium 98.0.4725.0 Windows");
    await new Promise(resolve => {
        fetch(`https://lens.google.com/upload?ep=ccm&s=&st=${generateRandomString(12)}`, {
            method: "POST",
            body: image_data_form,
        }).then(res => {
            if (res.status === 200) {
                return res.text();
            } else {
                throw new Error(`${res.status} ${res.statusText}`);
            }
        }).then(data => {
            let doc = (new DOMParser()).parseFromString(data, "text/html");
            let url = doc?.querySelector('meta[http-equiv="refresh"]')?.getAttribute("content")
                        ?.replace(" ", "")?.split(";")?.filter(str => str.startsWith("url="))?.slice(-1)[0]?.slice(4);

            if (url) {
                chrome.tabs.sendMessage(tab.id, "google-post-end");
                chrome.tabs.create({ url: new URL(url, "https://lens.google.com").href , windowId: tab.windowId, openerTabId: tab.id });
            } else {
                throw new Error(`URL is not included in the result`);
            }
        }).catch(e => {
            chrome.tabs.sendMessage(tab.id, "google-post-error");
            throw e;
        });
    });
}

chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") })
})

chrome.contextMenus.create({
    id: "image_right_click_selection",
    title: browser.i18n.getMessage("browserAction"),
    contexts: ["image"]
})

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    switch (info.menuItemId) {
        case "image_right_click_selection":
            search_on_google_lens(info.srcUrl, tab)
            break;
    }
})

chrome.runtime.onMessage.addListener(function (message, sender) {
    search_on_google_lens(message, sender.tab)
})
