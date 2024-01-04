// @ts-ignore
const mongoose = require('mongoose');

const MigrationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, unique: true },
    }, { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('migration', MigrationSchema);
