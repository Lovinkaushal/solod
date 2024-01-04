const fs = require('fs');
const path = require('path');

const directoryPathMigrations = path.join(__dirname, '../migrations');
const directoryPathSrc = path.join(__dirname, '../src');

function removeJsFiles(directoryPath) {
    fs.readdirSync(directoryPath).forEach(file => {
        const filePath = path.join(directoryPath, file);
        const isDirectory = fs.statSync(filePath).isDirectory();

        if (isDirectory) {
            // Recursively remove .js files in subdirectories
            removeJsFiles(filePath);
        } else if (file.endsWith('.js')) {
            // Remove .js file
            fs.unlinkSync(filePath);
        }
    });
}

removeJsFiles(directoryPathMigrations);
removeJsFiles(directoryPathSrc);
