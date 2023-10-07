for (const elem of document.querySelectorAll(".i18n-text")) {
    elem.innerText = browser.i18n.getMessage(elem.getAttribute("data-i18n-id"));
}

for (const elem of document.querySelectorAll(".i18n-value")) {
    elem.value = browser.i18n.getMessage(elem.getAttribute("data-i18n-id"));
}
