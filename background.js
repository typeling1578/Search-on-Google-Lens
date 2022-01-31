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

function search_on_google_lens(image_url, tab) {
    chrome.tabs.sendMessage(tab.id, "load-start");
    fetch(image_url)
        .then(res => {
            if (res.status === 200) {
                return res.blob();
            }else{
                chrome.tabs.sendMessage(tab.id, "image-get-error");
            }
        }).then(data => {
            if (data) {
                chrome.tabs.sendMessage(tab.id, "image-get-end");
                var form = new FormData()
                form.set("encoded_image", data)
                form.set("image_url", "https://" + generateRandomString(12) + ".com/" + generateRandomString(12));//プライバシー保護のため、適当なURLを送信
                form.set("sbisrc", "Chromium 98.0.4725.0 Windows")
                fetch("https://lens.google.com/upload?ep=ccm&s=&st=" + generateRandomString(12), {
                    method: "POST",
                    body: form
                }).then(res => {
                    if (res.status === 200) {
                        return res.text();
                    }else{
                        chrome.tabs.sendMessage(tab.id, "google-post-error");
                    }
                }).then(data => {
                    if (data) {
                        chrome.tabs.sendMessage(tab.id, "google-post-end");
                        console.log(data)
                        var url = data.match(/https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+/)[0];
                        console.log(url)
                        chrome.tabs.create({ url: url })
                    }
                }).catch(error => {
                    chrome.tabs.sendMessage(tab.id, "google-post-error");
                })
            }
        }).catch(error => {
            chrome.tabs.sendMessage(tab.id, "image-get-error");
        })
}

chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") })
})

chrome.contextMenus.create({
    id: "image_right_click_selection",
    title: "Search on Google Lens",
    contexts: ["image"]
})

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    switch (info.menuItemId) {
        case "image_right_click_selection":
            console.log(info.srcUrl);
            search_on_google_lens(info.srcUrl, tab)
            break;
    }
})

chrome.runtime.onMessage.addListener(function (message, sender) {
    search_on_google_lens(message, sender.tab)
})
