export default function (n) {
    const s = "abcdefghijklmnopqrstuvwxyz0123456789";
    let str = "";
    for (let i = 0; i < n; i++) {
        str += s[Math.floor(Math.random() * s.length)];
    }
    return str;
}
