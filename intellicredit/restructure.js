const fs = require('fs');
const path = require('path');

const root = __dirname;
const libsReferences = path.join(root, 'libs/references');

// make sure libs/references exists
if (!fs.existsSync(libsReferences)) {
    fs.mkdirSync(libsReferences, { recursive: true });
}

const dirs = fs.readdirSync(root);
const numberedDirs = dirs.filter(d => /^\d{2}-/.test(d));

numberedDirs.forEach(d => {
    const src = path.join(root, d);
    const dest = path.join(libsReferences, d);
    try {
        fs.renameSync(src, dest);
        console.log(`Moved ${d} to ${dest}`);
    } catch (e) {
        console.error(`Error moving ${d}:`, e.message);
    }
});
