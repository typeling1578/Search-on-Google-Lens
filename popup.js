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
        img.style.width = "100%";
        img.style.maxWidth = "500px";
        img.style.maxHeight = "500px";
        img.style.border = "1px solid"
        img.src = reader.result;
        preview.appendChild(img);
    };
}

button_elem.addEventListener("click",function(){
    chrome.runtime.sendMessage(preview.getElementsByTagName("img")[0].src)
})

function inject_loading_element() {
    var elem = document.createElement("div");
    elem.id = "search_on_google_lens_elem";
    elem.style.position = "fixed";
    elem.style.textAlign = "center";
    elem.style.top = "50%";
    elem.style.left = "50%";
    elem.style.width = "100%";
    elem.style.height = "100%";
    elem.style.backgroundColor = "rgba(0,0,0,0.6)";
    elem.style.color = "white"
    elem.style.transform = "translate(-50%,-50%)";
    elem.style.fontSize = "50px";
    elem.style.zIndex = "1000000";
    elem.innerText = "Fetching image...";
    document.body.appendChild(elem);
}

function image_get_end_elem_update() {
    var elem = document.getElementById("search_on_google_lens_elem");
    elem.innerText = "Sending image to Google...";
}

function google_post_end_elem_remove() {
    var elem = document.getElementById("search_on_google_lens_elem");
    elem.remove();
}

function image_get_error_elem_remove() {
    var elem = document.getElementById("search_on_google_lens_elem");
    elem.remove();
    alert("Failed to fetch the image.");
}

function google_post_error_elem_remove() {
    var elem = document.getElementById("search_on_google_lens_elem");
    elem.remove();
    alert("Failed to send the image to Google.");
}

chrome.runtime.onMessage.addListener(function (message) {
    switch (message) {
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

