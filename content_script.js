if(location.hostname == "lens.google.com"){
    function a(){
        if(document.body && document.body.addEventListener){
            var sc = document.createElement("script");
            sc.src = chrome.runtime.getURL("touch_start_event_blocking.js");
            document.body.appendChild(sc);
        }else{
            setTimeout(a,1)
        }
    }
    setTimeout(a,1)
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
    main_elem_img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwcHgiIGhlaWdodD0iMjAwcHgiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzQyODVmNCIgc3Ryb2tlLXdpZHRoPSIxMCIgcj0iMzUiIHN0cm9rZS1kYXNoYXJyYXk9IjE2NC45MzM2MTQzMTM0NjQxNSA1Ni45Nzc4NzE0Mzc4MjEzOCI+CiAgPGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiBkdXI9IjFzIiB2YWx1ZXM9IjAgNTAgNTA7MzYwIDUwIDUwIiBrZXlUaW1lcz0iMDsxIj48L2FuaW1hdGVUcmFuc2Zvcm0+CjwvY2lyY2xlPgo8L3N2Zz4=";

    var main_elem_text = document.createElement("div");
    main_elem_text.innerText = "Fetching image...";

    main_elem.appendChild(main_elem_img);
    main_elem.appendChild(main_elem_text);

    elem.appendChild(main_elem);

    document.body.appendChild(elem);
}

function image_get_end_elem_update() {
    var elem = document.getElementById("search_on_google_lens_elem").querySelector("div > div > div");
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
