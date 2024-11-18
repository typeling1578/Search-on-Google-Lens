/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export default class ContentScriptRegister {
    constructor(script_options) {
        this.script_options = script_options;
        this.registed = null;
    }
    async load() {
        if (!this.registed) {
            this.registed = await browser.contentScripts.register(this.script_options);
        }
    }
    unload() {
        if (this.registed) {
            this.registed.unregister();
            this.registed = null;
        }
    }
}
