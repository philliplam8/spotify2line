const fs = require('fs');           // fs Module to read/write JSON files

/**
 * LINE labels only allow <= 20 characters and doesn't allow keyword "LINE"
 * @param {string} name label name 
 * @returns {string} trimmed label name
 */
function shortenToTwentyChar(name) {

    // Regex to detect keyword "LINE"
    const pattern = /line/i;
    let match = pattern.exec(name);

    // Trim off any instance of "LINE" keyword
    if (pattern.test(name)) {
        let nameUpdate = name;
        nameUpdate = name.substring(0, match.index);
        name = nameUpdate;
    }

    // Show full artist name if less than 20
    if (name.length <= 20) {
        return name;
    }
    // Otherwise shorten artist name with ellipsis
    else {
        return name.substring(0, 17) + "...";
    }
}

function readStoredTotalValue() {
    const JSON_FILE = './total.json';
    let rawdata = fs.readFileSync(JSON_FILE);
    return JSON.parse(rawdata);
}

function updatedStoredTotalValue(updatedValue) {
    const JSON_FILE = './total.json';
    fs.writeFileSync(JSON_FILE, JSON.stringify(updatedValue));
}

function roundToFloorHundreds(decimalNumber) {
    return 100 * Math.floor(decimalNumber / 100);
}

module.exports = {
    shortenToTwentyChar,
    readStoredTotalValue,
    updatedStoredTotalValue,
    roundToFloorHundreds
}