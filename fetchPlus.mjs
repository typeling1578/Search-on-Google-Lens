import generateRandomString from "./generateRandomString.mjs";

export default async function(url, options = {}) {
    const requestId = generateRandomString(12);

    let fetch_options = Object.assign({}, options);
    fetch_options.headers = {
        "Fetch-Plus-Request-Id": requestId,
    };

    const listener = function(details) {
        let requestHeaders = details.requestHeaders;

        for (const requestHeader of requestHeaders) {
            if (requestHeader.name == "Fetch-Plus-Request-Id" &&
                requestHeader.value == requestId) {
                browser.webRequest.onBeforeSendHeaders.removeListener(listener);

                requestHeaders =
                    requestHeaders.filter(requestHeader =>
                        requestHeader.name !== "Fetch-Plus-Request-Id"
                    );

                for (const headerName of Object.keys(options.headers)) {
                    requestHeaders =
                        requestHeaders.filter(requestHeader =>
                            requestHeader.name.toLowerCase() !== headerName.toLowerCase()
                        );

                    requestHeaders.push({
                        name: headerName,
                        value: options.headers[headerName],
                    });
                }

                return { requestHeaders }
            }
        }
    }
    browser.webRequest.onBeforeSendHeaders.addListener(
        listener,
        { urls: [url] },
        ["blocking", "requestHeaders"]
    );

    try {
        return await fetch(url, fetch_options);
    } catch (e) {
        browser.webRequest.onBeforeSendHeaders.removeListener(listener);
        throw e;
    }
}
