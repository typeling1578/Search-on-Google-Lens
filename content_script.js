/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

if (!window.browser) {
    window.browser = chrome;
}

browser.runtime.onMessage.addListener(async function (message) {
    console.log("[Content Scripts]", `message received: ${message.type}`);

    const elem = document.getElementById("search_on_google_lens_elem");

    switch (message.type) {
        case "load-start":
            const overlay = document.createElement("div");
            overlay.id = "search_on_google_lens_elem";

            overlay.style.position = "fixed";
            overlay.style.textAlign = "center";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
            overlay.style.zIndex = "1000000";

            const centerContainer = document.createElement("div");

            centerContainer.style.position = "absolute";
            centerContainer.style.top = "50%";
            centerContainer.style.left = "50%";
            centerContainer.style.color = "white";
            centerContainer.style.transform = "translate(-50%, -50%)";
            centerContainer.style.fontSize = "50px";
            centerContainer.style.whiteSpace = "nowrap";

            const img = document.createElement("img");
            img.src = browser.runtime.getURL("loading.svg");

            img.style.width = "60px";
            img.style.height = "60px";

            const textDiv = document.createElement("div");
            textDiv.innerText = message.thinking ? "🤔" : browser.i18n.getMessage("sendingImage");

            centerContainer.appendChild(img);
            centerContainer.appendChild(textDiv);

            overlay.appendChild(centerContainer);

            document.body.appendChild(overlay);
            break;
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
