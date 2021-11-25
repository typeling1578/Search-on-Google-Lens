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

browser.runtime.onMessage.addListener(function (message) {
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
            break;
        case "google_post-error":
            console.log("google-post-error");
            break;
    }
})
