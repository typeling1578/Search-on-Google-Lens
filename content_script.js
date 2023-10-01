if (!window.browser) {
    window.browser = chrome;
}

if (location.hostname == "lens.google.com") {
    let sc = document.createElement("script");
    sc.src = browser.runtime.getURL("touch_start_event_blocking.js");
    document.documentElement.appendChild(sc);
}

if (location.protocol == "moz-extension:" || location.protocol == "chrome-extension:") {
    const supported_file_types = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/tiff",
    ];

    const button_elem = document.getElementById("button_elem");
    const dropzone = document.getElementById("dropzone");
    const fileinput = document.getElementById("fileinput");
    const preview = document.getElementById("preview");

    dropzone.addEventListener("dragover", function(e) {
        e.stopPropagation();
        e.preventDefault();
        this.classList = ["file-dragover"];
    });

    dropzone.addEventListener("dragleave", function(e) {
        e.stopPropagation();
        e.preventDefault();
        this.classList = ["file-dragleave"];
    });

    dropzone.addEventListener("drop", function(e) {
        e.stopPropagation();
        e.preventDefault();
        this.classList = ["file-drop"];
        const files = e.dataTransfer.files;
        if (files.length > 1){
            alert("Only one file can be uploaded at a time.");
            return;
        }
        fileinput.files = files;
        if (!supported_file_types.includes(files[0].type)) {
            alert("Unsupported file type.");
            return;
        }
        previewfile(files[0]);
    });

    fileinput.addEventListener("change", function () {
        if (!supported_file_types.includes(this.files[0].type)) {
            alert("Unsupported file type.");
            return;
        }
        previewfile(this.files[0]);
    });

    function previewfile(file) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function() {
            preview.innerHTML = "";
            let img = document.createElement("img");
            img.style.maxWidth = "100%";
            img.style.maxHeight = "70vh";
            img.style.border = "1px solid";
            img.src = reader.result;
            preview.appendChild(img);
        };
    }

    button_elem.addEventListener("click",function() {
        browser.runtime.sendMessage({ type: "send-image", src: preview.getElementsByTagName("img")[0].src });
    });

    document.addEventListener("DOMContentLoaded", function() {
        let elems = document.getElementsByClassName("i18n-text");
        for (let i = 0; i < elems.length; i++) {
            elems[i].innerText = browser.i18n.getMessage(elems[i].getAttribute("data-i18n-id"));
        }

        let elems2 = document.getElementsByClassName("i18n-value");
        for (let i = 0; i < elems2.length; i++) {
            elems2[i].value = browser.i18n.getMessage(elems2[i].getAttribute("data-i18n-id"));
        }
    });
}

function inject_loading_element() {
    var elem = document.createElement("div");
    elem.id = "search_on_google_lens_elem";
    elem.style.position = "fixed";
    elem.style.textAlign = "center";
    elem.style.top = "0";
    elem.style.left = "0;"
    elem.style.width = "100%";
    elem.style.height = "100%";
    elem.style.backgroundColor = "rgba(0,0,0,0.6)";
    elem.style.zIndex = "1000000";

    var main_elem = document.createElement("div");
    main_elem.style.position = "absolute";
    main_elem.style.top = "50%";
    main_elem.style.left = "50%";
    main_elem.style.color = "white"
    main_elem.style.transform = "translate(-50%,-50%)";
    main_elem.style.fontSize = "50px";
    main_elem.style.whiteSpace = "nowrap";

    var main_elem_img = document.createElement("img");
    main_elem_img.style.width = "60px";
    main_elem_img.style.height = "60px";
    main_elem_img.src = browser.runtime.getURL("loading.svg");

    var main_elem_text = document.createElement("div");
    main_elem_text.innerText = browser.i18n.getMessage("fetchingImage");

    main_elem.appendChild(main_elem_img);
    main_elem.appendChild(main_elem_text);

    elem.appendChild(main_elem);

    document.body.appendChild(elem);
}

function image_get_end_elem_update() {
    var elem = document.getElementById("search_on_google_lens_elem").querySelector("div > div > div");
    elem.innerText = browser.i18n.getMessage("sendingImage");
}

function google_post_end_elem_remove() {
    var elem = document.getElementById("search_on_google_lens_elem");
    elem.remove();
}

function image_get_error_elem_remove() {
    var elem = document.getElementById("search_on_google_lens_elem");
    elem.remove();
    alert(browser.i18n.getMessage("fetchingImageError"));
}

function google_post_error_elem_remove() {
    var elem = document.getElementById("search_on_google_lens_elem");
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
