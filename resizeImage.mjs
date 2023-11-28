export default async function resizeImage(image_blob, options_) {
    const options = Object.assign({
        mode: "maxSize",
        maxWidth: 1000,
        maxHeight: 1000,
        width: null,
        height: null,
        forceEncode: false,
    }, options_);

    const image_blob_url = URL.createObjectURL(image_blob);

    const image_elem = await new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", reject);
        image.src = image_blob_url;
    });

    if (image_elem.naturalWidth === 0 || image_elem.naturalHeight === 0) {
        // 寸法が指定されていないSVGかもしれない
        if (image_blob.size > 1 * 1024 * 1024) {
            throw new Error("Filesize too large");
        }
        const text = await image_blob.text();
        console.log(text);
        if (/<svg.*>.*<\/svg>/is.test(text)) {
            const xml_data = (new DOMParser()).parseFromString(text, "image/svg+xml");
            const svg_elem = xml_data.querySelector("svg");
            if (image_elem.naturalWidth === 0 && image_elem.naturalHeight === 0) {
                svg_elem.setAttribute(
                    "width",
                    options.mode == "fixedSize" ? options.width : options.maxWidth,
                );
                svg_elem.setAttribute(
                    "height",
                    options.mode == "fixedSize" ? options.height : options.maxHeight,
                );
            } else if (iamge_elem.naturalWidth === 0) {
                svg_elem.setAttribute(
                    "width",
                    svg_elem.getAttribute("height"),
                );
            } else if (image_elem.naturalHeight === 0) {
                svg_elem.setAttribute(
                    "height",
                    svg_elem.getAttribute("width"),
                );
            }
            return resizeImage(
                new Blob([xml_data.documentElement.outerHTML], { type: "image/svg+xml" }),
                options,
            );
        } else {
            throw new Error("invalid image size");
        }
    }

    let afterWidth;
    let afterHeight;

    if (options.mode == "maxSize" && options.maxWidth && options.maxHeight) {
        let beforeWidth = image_elem.naturalWidth;
        let beforeHeight = image_elem.naturalHeight;
        afterWidth = beforeWidth;
        afterHeight = beforeHeight;

        while (afterWidth > options.maxWidth || afterHeight > options.maxHeight) {
            beforeWidth = afterWidth;
            beforeHeight = afterHeight;

            if (afterWidth >= afterHeight) {
                if (afterWidth > options.maxWidth) {
                    afterWidth = options.maxWidth;
                    afterHeight = Math.floor(beforeHeight * (afterWidth / beforeWidth));
                } else if (afterHeight > options.maxHeight) {
                    afterHeight = options.maxHeight;
                    afterWidth = Math.floor(beforeWidth * (afterHeight / beforeHeight));
                }
            } else if (afterWidth < afterHeight) {
                if (afterHeight > options.maxHeight) {
                    afterHeight = options.maxHeight;
                    afterWidth = Math.floor(beforeWidth * (afterHeight / beforeHeight));
                } else if (afterWidth > options.maxWidth) {
                    afterWidth = options.maxWidth;
                    afterHeight = Math.floor(beforeHeight * (afterWidth / beforeWidth));
                }
            }
        }
    } else if (options.mode == "fixedSize" && options.width && options.height) {
        afterWidth = options.width;
        afterHeight = options.height;
    } else {
        throw new Error("invalid options");
    }

    if (!options.forceEncode && image_elem.naturalWidth == afterWidth && image_elem.naturalHeight == afterHeight) {
        // no resizing is required.
        URL.revokeObjectURL(image_blob_url);
        return image_blob;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.canvas.width = afterWidth;
    context.canvas.height = afterHeight;
    context.drawImage(
        image_elem,
        0,
        0,
        image_elem.naturalWidth,
        image_elem.naturalHeight,
        0,
        0,
        afterWidth,
        afterHeight,
    );

    const after_image_blob = await new Promise(resolve => context.canvas.toBlob(resolve, "image/jpeg", 0.95));

    canvas.remove();
    image_elem.remove();
    URL.revokeObjectURL(image_blob_url);

    return after_image_blob;
}
