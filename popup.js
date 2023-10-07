for (const elem of document.querySelectorAll("iframe")) {
    setInterval(function() {
        elem.style.height = elem.contentWindow.document.body.scrollHeight + "px";
    }, 1);
}
