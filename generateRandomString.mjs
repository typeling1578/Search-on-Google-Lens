export default function (n) {
    var s = "abcdefghijklmnopqrstuvwxyz0123456789";
    var str = "";
    for (var i = 0; i < n; i++) {
        str += s[Math.floor(Math.random() * s.length)];
    }
    return str;
}
