if (!window.browser) {
    window.browser = chrome;
}

var button_elem = document.getElementById("button_elem");
var dropzone = document.getElementById("dropzone");
var fileinput = document.getElementById("fileinput");
var preview = document.getElementById("preview");

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
    var files = e.dataTransfer.files;
    if (files.length > 1){
        alert("Only one file can be uploaded at a time.");
        return;
    }
    fileinput.files = files;
    if(!(files[0].type == "image/png" || files[0].type == "image/jpeg" || files[0].type == "image/webp" || files[0].type == "image/tiff")){
        alert("Unsupported file type.")
        return;
    }
    previewfile(files[0]);
});

fileinput.addEventListener("change", function () {
    if(!(this.files[0].type == "image/png" || this.files[0].type == "image/jpeg" || this.files[0].type == "image/webp" || this.files[0].type == "image/tiff")){
        alert("Unsupported file type.")
        return;
    }
    previewfile(this.files[0]);
});

function previewfile(file) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function() {
        preview.innerHTML = "";
        var img = document.createElement("img");
        img.style.maxWidth = "100%";
        img.style.maxHeight = "70vh";
        img.style.border = "1px solid";
        img.src = reader.result;
        preview.appendChild(img);
    };
}

button_elem.addEventListener("click",function(){
    browser.runtime.sendMessage({ type: "send-image", src: preview.getElementsByTagName("img")[0].src })
})

document.addEventListener("DOMContentLoaded", function() {
    let elems = document.getElementsByClassName("i18n-text");
    for (let i = 0; i < elems.length; i++) {
        elems[i].innerText = browser.i18n.getMessage(elems[i].getAttribute("data-i18n-id"));
    }

    let elems2 = document.getElementsByClassName("i18n-value");
    for (let i = 0; i < elems2.length; i++) {
        elems2[i].value = browser.i18n.getMessage(elems2[i].getAttribute("data-i18n-id"));
    }
})

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
    main_elem_img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwcHgiIGhlaWdodD0iMjAwcHgiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzQyODVmNCIgc3Ryb2tlLXdpZHRoPSIxMCIgcj0iMzUiIHN0cm9rZS1kYXNoYXJyYXk9IjE2NC45MzM2MTQzMTM0NjQxNSA1Ni45Nzc4NzE0Mzc4MjEzOCI+CiAgPGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiBkdXI9IjFzIiB2YWx1ZXM9IjAgNTAgNTA7MzYwIDUwIDUwIiBrZXlUaW1lcz0iMDsxIj48L2FuaW1hdGVUcmFuc2Zvcm0+CjwvY2lyY2xlPgo8L3N2Zz4=";

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
            console.log("load-start")
            inject_loading_element();
            break;
        case "image-get-end":
            console.log("image-get-end")
            image_get_end_elem_update();
            break;
        case "google-post-end":
            console.log("google-post-end")
            google_post_end_elem_remove();
            break;
        case "image-get-error":
            console.log("image-get-error");
            image_get_error_elem_remove();
            break;
        case "google_post-error":
            console.log("google-post-error");
            google_post_error_elem_remove();
            break;
    }
})

