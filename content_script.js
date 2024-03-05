if (!window.browser) {
    window.browser = chrome;
}

if (location.hostname == "lens.google.com") {
    let sc = document.createElement("script");
    sc.src = browser.runtime.getURL("injects/touch_start_event_blocking.js");
    document.documentElement.appendChild(sc);
}

browser.runtime.onMessage.addListener(function (message) {
    console.log("[Content Scripts]", `message received: ${message.type}`);

    const elem = document.getElementById("search_on_google_lens_elem");

    switch (message.type) {
        case "load-start":
            const elem_string = `
            <div id="search_on_google_lens_elem" style="position: fixed; text-align: center; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); z-index: 1000000;">
                <div style="position: absolute; top: 50%; left: 50%; color: white; transform: translate(-50%, -50%); font-size: 50px; white-space: nowrap;">
                    <img style="width: 60px; height: 60px;" src="${browser.runtime.getURL("loading.svg")}"></img>
                    <div>${browser.i18n.getMessage("fetchingImage")}</div>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML("beforeend", elem_string);
            break;
        case "image-get-end":
            elem.querySelector("div > div > div")
                .innerText = browser.i18n.getMessage("sendingImage");
            break;
        case "google-post-end":
            elem.remove();
            break;
        case "image-get-error":
            elem.remove();
            alert(browser.i18n.getMessage("fetchingImageError"));
            break;
        case "google-post-error":
            elem.remove();
            alert(browser.i18n.getMessage("sendingImageError"));
            break;
        default:
            break;
    }
});
