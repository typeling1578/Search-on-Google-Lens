/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

if (!window.browser) {
    window.browser = chrome;
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
                    <div>${message.thinking ? "🤔" : browser.i18n.getMessage("fetchingImage")}</div>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML("beforeend", elem_string);
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
