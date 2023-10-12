export default async function(image_blob, options_) {
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
        image.addEventListener("error", () => reject);
        image.src = image_blob_url;
    });

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

    const after_image_blob = await new Promise(resolve => context.canvas.toBlob(resolve, "image/jpeg", 0.9));

    canvas.remove();
    URL.revokeObjectURL(image_blob_url);

    return after_image_blob;
}
