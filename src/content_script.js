//@if BROWSER="chromium"
const browser = chrome;
//@endif

//@if BROWSER="chromium"
//@include modules/resizeImage.inc.mjs
//@endif

if (location.hostname == "lens.google.com") {
    let sc = document.createElement("script");
    sc.src = browser.runtime.getURL("injects/touch_start_event_blocking.js");
    document.documentElement.appendChild(sc);
}

browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log("[Content Scripts]", `message received: ${message.type}`);

    const elem = document.getElementById("search_on_google_lens_elem");

    switch (message.type) {
        case "load-start":
            const elem_string = `
            <div id="search_on_google_lens_elem" style="position: fixed; text-align: center; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); z-index: 1000000;">
                <div style="position: absolute; top: 50%; left: 50%; color: white; transform: translate(-50%, -50%); font-size: 50px; white-space: nowrap;">
                    <img style="width: 60px; height: 60px;" src="${browser.runtime.getURL("loading.svg")}"></img>
                    <div>${message.thinking ? "🤔" : browser.i18n.getMessage("fetchingImage")}</div>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML("beforeend", elem_string);
            break;
//@if BROWSER="chromium"
        case "request-image-processing-cs":
            (async () => {
                const image_data = await fetch(message.image_url)
                    .then(res => {
                        if (res.status === 200) {
                            return res.blob();
                        } else {
                            throw new Error(`${res.status} ${res.statusText}`);
                        }
                    })
                    .then(data => data)
                    .catch(e => {
                        sendResponse({ type: "request-image-processing-cs-error" });
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
                        sendResponse({ type: "request-image-processing-cs-error" });
                        throw e;
                    });

                const image_processed_url = URL.createObjectURL(image_data_processed);
                setTimeout(() => {
                    URL.revokeObjectURL(image_processed_url);
                }, 30000);

                sendResponse({ type: "request-image-processing-cs-end", image_processed_url: image_processed_url });
            })();
            return true;
            break;
//@endif
        case "image-get-end":
            elem.querySelector("div > div > div")
                .innerText = message.thinking ? "🤔" : browser.i18n.getMessage("sendingImage");
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
