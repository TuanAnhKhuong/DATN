const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const categorySchema = new Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        description: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('category', categorySchema);
