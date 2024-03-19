import generateRandomString from "./generateRandomString.mjs";

//@if BROWSER="chromium"
const browser = chrome;
//@endif

export default async function(url, options = {}) {
    const requestId = generateRandomString(12);

    let fetch_options = Object.assign({}, options);
//@if BROWSER="firefox"
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
//@endif

    try {
        return await fetch(url, fetch_options);
    } catch (e) {
//@if BROWSER="firefox"
        browser.webRequest.onBeforeSendHeaders.removeListener(listener);
//@endif
        throw e;
    }
}
