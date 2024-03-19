import fs from "fs";
import { glob } from "glob";
import { preprocess } from "preprocess";

if (!["chromium", "firefox"].includes(process.argv[2])) {
    throw new Error("Unsupported Browser");
}
const browser = process.argv[2];

fs.rmSync("./dist", { recursive: true, force: true });
fs.mkdirSync("./dist");
fs.cpSync("./src", "./dist", { recursive: true });

process.chdir("./dist");

const files = glob.sync("./**/*.{html,js,mjs,css,json}");
for (const file of files) {
    if (file.includes(".inc.")) continue;
    console.log("Compiling:", file);
    const text = fs.readFileSync(file).toString("utf8");
    const preprocessed = preprocess(
        text,
        { BROWSER: browser },
        { type: file.endsWith(".html") ? "html" : "js" },
    );
    fs.writeFileSync(file, preprocessed);
}
for (const file of files) {
    if (file.includes(".inc.")) {
        fs.rmSync(file);
    }
}

process.chdir("../");

console.log("Done");
