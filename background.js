function search_by_google_lens(image_url, tab) {
    browser.tabs.sendMessage(tab.id, "load-start")

    //fetchでやったほうがいいのはわかってるけど、使い方がいまいちわからんので、とりあえずXHR。理解したら、書き換える。

    function imaeg_get_error() {
        browser.tabs.sendMessage(tab.id, "image-get-error")
    }

    function google_post_error() {
        browser.tabs.sendMessage(tab.id, "google-post-error")
    }

    function reqListener() {
        if (this.status != 200) {
            imaeg_get_error();
            return;
        }
        browser.tabs.sendMessage(tab.id, "image-get-end")

        var res = this.response;
        console.log(res);

        var form = new FormData()
        form.set("encoded_image", res)
        form.set("image_url", "https://" + (new Date()).getTime() + ".com/" + (new Date()).getTime())//プライバシー保護のため、適当なURLを送信
        form.set("sbisrc", "Chromium 98.0.4725.0 Windows")

        function reqListener2() {
            if (this.status != 200) {
                google_post_error();
                return;
            }

            browser.tabs.sendMessage(tab.id, "google-post-end")

            var res = this.responseText;
            console.log(res)
            var url = res.match(/https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+/)[0];
            console.log(url)
            window.open(url)
            browser.tabs.create({ url: url })
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

browser.browserAction.onClicked.addListener(function(){
    browser.tabs.create({ url: chrome.runtime.getURL("popup.html") })
})

browser.contextMenus.create({
    id: "image_right_click_selection",
    title: "Search on Google Lens",
    contexts: ["image"]
})

browser.contextMenus.onClicked.addListener(function (info, tab) {
    switch (info.menuItemId) {
        case "image_right_click_selection":
            console.log(info.srcUrl);
            search_by_google_lens(info.srcUrl, tab)
            break;
    }
})

browser.runtime.onMessage.addListener(function(message, sender){
    search_by_google_lens(message, sender.tab)
})
