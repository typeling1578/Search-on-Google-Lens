import addonSettings from "./modules/addonSettings.mjs";

//@if BROWSER="chromium"
const browser = chrome;
//@endif

const settings = new addonSettings();
await settings.init();

function switch_page(page_id) {
    for (let elem of document.querySelectorAll(".content > .body-content > *")) {
        if (elem.getAttribute("data-page-id") == page_id) {
            elem.classList.remove("inactive-page");
            elem.classList.add("active-page");
        } else {
            elem.classList.remove("active-page");
            elem.classList.add("inactive-page");
        }
    }

    for (let elem of document.querySelectorAll(".content > .side-menu > *")) {
        if (elem.getAttribute("href").slice(1) == page_id) {
            elem.setAttribute("selected", "true");
        } else {
            elem.removeAttribute("selected");
        }
    }
}

window.addEventListener("hashchange", function() {
    switch_page(location.hash.slice(1));
});

if (location.hash) {
    switch_page(location.hash.slice(1));
} else {
    let page_id = document.querySelector(".content > .side-menu > .side-menu-default").getAttribute("href").slice(1);
    location.hash = `#${page_id}`;
}

for (let elem of document.querySelectorAll(".version-number")) {
    elem.innerText = browser.runtime.getManifest().version;
}

const supported_file_types = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/tiff",
];

const button_elem = document.querySelector('[data-page-id="search"] .search_button');
const dropzone = document.querySelector('[data-page-id="search"] .dropzone');
const fileinput = document.querySelector('[data-page-id="search"] .fileinput');
const preview = document.querySelector('[data-page-id="search"] .preview');

dropzone.addEventListener("dragover", function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.setAttribute("data-dropzone-status", "file-dragover");
});

dropzone.addEventListener("dragleave", function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.setAttribute("data-dropzone-status", "file-dragleave");
});

dropzone.addEventListener("drop", function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.setAttribute("data-dropzone-status", "file-drop");
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

for (const elem of document.querySelectorAll("iframe")) {
    setInterval(function() {
        elem.style.height = elem.contentWindow.document.body.scrollHeight + "px";
    }, 1);
}
