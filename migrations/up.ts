require('dotenv').config();

const mongoose = require('mongoose');
const path = require('path');
const MigrationModel = require('./migration.model');
const fs = require('fs');
const files = fs.readdirSync(path.join(__dirname, './files'));

mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DBNAME}`, {}, async () => {
    const migrationFiles = await MigrationModel.find({});
    for (const file of files) {
        if (!migrationFiles.find((migrationFile) => file === migrationFile.name) && file.endsWith('.js')) {
            console.log(file);
            const { up } = require(`./files/${file}`);
            await up();
            await MigrationModel.create({
                name: file,
            });
        }
    }
    process.exit(1);
});