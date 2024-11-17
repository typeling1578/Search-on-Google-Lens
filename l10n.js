/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

if (!window.browser) {
    window.browser = chrome;
}

for (const elem of document.querySelectorAll(".i18n-text")) {
    elem.innerText = browser.i18n.getMessage(elem.getAttribute("data-i18n-id"));
}

for (const elem of document.querySelectorAll(".i18n-value")) {
    elem.value = browser.i18n.getMessage(elem.getAttribute("data-i18n-id"));
}
