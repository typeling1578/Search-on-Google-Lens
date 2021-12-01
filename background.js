var targetPage = "https://lens.google.com/*";
var ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36";
function rewriteUserAgentHeader(e) {
    e.requestHeaders.forEach(function(header){
        if (header.name.toLowerCase() === "user-agent") {
            header.value = ua;
        }
    });
    return {requestHeaders: e.requestHeaders};
}
chrome.webRequest.onBeforeSendHeaders.addListener(
    rewriteUserAgentHeader,
    {urls: [targetPage]},
    ["blocking", "requestHeaders"]
);

function generateRandomByteString(n){
    var str = "";
    for (var i = 0; i < n; i++){
        str += Math.floor(Math.random() * 16).toString(16);
    }
    return str;
}

function search_on_google_lens(image_url, tab) {
    chrome.tabs.sendMessage(tab.id, "load-start")

    //fetchでやったほうがいいのはわかってるけど、使い方がいまいちわからんので、とりあえずXHR。理解したら、書き換える。

    function imaeg_get_error() {
        chrome.tabs.sendMessage(tab.id, "image-get-error")
    }

    function google_post_error() {
        chrome.tabs.sendMessage(tab.id, "google-post-error")
    }

    function reqListener() {
        if (this.status != 200) {
            imaeg_get_error();
            return;
        }
        chrome.tabs.sendMessage(tab.id, "image-get-end")

        var res = this.response;
        console.log(res);

        var form = new FormData()
        form.set("encoded_image", res)
        form.set("image_url", "https://" + generateRandomByteString(12) + ".com/" + generateRandomByteString(12));//プライバシー保護のため、適当なURLを送信
        form.set("sbisrc", "Chromium 98.0.4725.0 Windows")

        function reqListener2() {
            if (this.status != 200) {
                google_post_error();
                return;
            }

            chrome.tabs.sendMessage(tab.id, "google-post-end")

            var res = this.responseText;
            console.log(res)
            var url = res.match(/https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+/)[0];
            console.log(url)
            chrome.tabs.create({ url: url })
        }
        var xhr2 = new XMLHttpRequest();
        xhr2.open("POST", "https://lens.google.com/upload?ep=ccm&s=&st=" + (new Date()).getTime())
        xhr2.addEventListener("load", reqListener2)
        xhr2.addEventListener("error", google_post_error)
        xhr2.send(form)
    }
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", reqListener)
    xhr.addEventListener("error", imaeg_get_error)
    xhr.open("GET", image_url);
    xhr.responseType = "blob"
    xhr.send();
}

chrome.browserAction.onClicked.addListener(function(){
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

chrome.runtime.onMessage.addListener(function(message, sender){
    search_on_google_lens(message, sender.tab)
})
