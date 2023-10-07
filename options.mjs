import addonSettings from "./addonSettings.mjs";

if (!window.browser) {
    window.browser = chrome;
}

const settings = new addonSettings();
await settings.init();

for (let elem of document.querySelectorAll("input[data-pref-id]")) {
    const prefId = elem.getAttribute("data-pref-id");
    if (elem.type == "checkbox") {
        elem.checked = elem.hasAttribute("data-pref-reverse") ?
            !settings.get("local", prefId) :
            settings.get("local", prefId);
    } else {
        elem.value = settings.get("local", prefId);
    }
    elem.addEventListener("change", function() {
        settings.set(
            "local",
            prefId,
            elem.type == "checkbox" ?
                (elem.hasAttribute("data-pref-reverse") ? !elem.checked : elem.checked) :
                elem.value
        );
    });
}
settings.addListener(function(areaName, changes, config) {
    for (const key of Object.keys(config)) {
        for (const elem of document.querySelectorAll(`input[data-pref-id="${key}"]`)) {
            if (elem.type == "checkbox") {
                elem.checked = elem.hasAttribute("data-pref-reverse") ?
                    !config[key] :
                    config[key];
            } else {
                elem.value = config[key];
            }
        }
    }
}, {type: "local"});
