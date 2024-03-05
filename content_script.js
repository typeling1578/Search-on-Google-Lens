if (!window.browser) {
    window.browser = chrome;
}

if (location.hostname == "lens.google.com") {
    let sc = document.createElement("script");
    sc.src = browser.runtime.getURL("injects/touch_start_event_blocking.js");
    document.documentElement.appendChild(sc);
}

function inject_loading_element() {
    let elem = document.createElement("div");
    elem.id = "search_on_google_lens_elem";
    elem.style.position = "fixed";
    elem.style.textAlign = "center";
    elem.style.top = "0";
    elem.style.left = "0;"
    elem.style.width = "100%";
    elem.style.height = "100%";
    elem.style.backgroundColor = "rgba(0,0,0,0.6)";
    elem.style.zIndex = "1000000";

    let main_elem = document.createElement("div");
    main_elem.style.position = "absolute";
    main_elem.style.top = "50%";
    main_elem.style.left = "50%";
    main_elem.style.color = "white"
    main_elem.style.transform = "translate(-50%,-50%)";
    main_elem.style.fontSize = "50px";
    main_elem.style.whiteSpace = "nowrap";

    let main_elem_img = document.createElement("img");
    main_elem_img.style.width = "60px";
    main_elem_img.style.height = "60px";
    main_elem_img.src = browser.runtime.getURL("loading.svg");

    let main_elem_text = document.createElement("div");
    main_elem_text.innerText = browser.i18n.getMessage("fetchingImage");

    main_elem.appendChild(main_elem_img);
    main_elem.appendChild(main_elem_text);

    elem.appendChild(main_elem);

    document.body.appendChild(elem);
}

function image_get_end_elem_update() {
    let elem = document.getElementById("search_on_google_lens_elem").querySelector("div > div > div");
    elem.innerText = browser.i18n.getMessage("sendingImage");
}

function google_post_end_elem_remove() {
    let elem = document.getElementById("search_on_google_lens_elem");
    elem.remove();
}

function image_get_error_elem_remove() {
    let elem = document.getElementById("search_on_google_lens_elem");
    elem.remove();
    alert(browser.i18n.getMessage("fetchingImageError"));
}

function google_post_error_elem_remove() {
    let elem = document.getElementById("search_on_google_lens_elem");
    elem.remove();
    alert(browser.i18n.getMessage("sendingImageError"));
}

browser.runtime.onMessage.addListener(function (message) {
    switch (message.type) {
        case "load-start":
            console.log("load-start");
            inject_loading_element();
            break;
        case "image-get-end":
            console.log("image-get-end");
            image_get_end_elem_update();
            break;
        case "google-post-end":
            console.log("google-post-end");
            google_post_end_elem_remove();
            break;
        case "image-get-error":
            console.log("image-get-error");
            image_get_error_elem_remove();
            break;
        case "google-post-error":
            console.log("google-post-error");
            google_post_error_elem_remove();
            break;
    }
})
