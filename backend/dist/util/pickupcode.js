"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.random4Digit = random4Digit;
function random4Digit() {
    return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}
