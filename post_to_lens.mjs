/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(async () => {
    const params = new URLSearchParams(window.location.search);
    const image_data_url = decodeURIComponent(params.get("image_data_url") ?? "");
    if (!image_data_url) {
        return;
    }

    const container = document.createElement("div");
    container.style.display = "none";
    document.body.appendChild(container);

    const form = document.createElement("form");
    form.action = `https://lens.google.com/v3/upload?ep=ccm&s=&st=${Date.now()}`;
    form.method = "POST";
    form.enctype = "multipart/form-data";
    // form.target = "_blank";
    container.appendChild(form);

    const file_input = document.createElement("input");
    file_input.type = "file";
    file_input.name = "encoded_image";
    form.appendChild(file_input);

    const pid_input = document.createElement("input");
    pid_input.type = "text";
    pid_input.name = "processed_image_dimensions";
    pid_input.value = "1000,1000";

    const result = await fetch(image_data_url);
    const file = new Blob([await result.arrayBuffer()]);
    const data_transfer = new DataTransfer();
    const file_obj = new File([file], "image.jpg", { type: "image/jpeg" });
    data_transfer.items.add(file_obj);
    file_input.files = data_transfer.files;

    form.submit();

    container.remove();
})();