export default function decodeHTMLEntities(text) {
    return text
        .replaceAll("&amp;", "&")
        .replaceAll("&apos;", "'")
        .replaceAll("#x27", "'")
        .replaceAll("#39", "'")
        .replaceAll("#x2F", "/")
        .replaceAll("#47", "/")
        .replaceAll("lt", "<")
        .replaceAll("gt", ">")
        .replaceAll("nbsp", " ")
        .replaceAll("quot", '"');
}
