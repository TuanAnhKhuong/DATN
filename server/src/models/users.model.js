const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelUser = new Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String, default: '' },
        address: { type: String, default: '' },
        birthDay: { type: Date, default: null },
        role: {
            type: String,
            enum: ['admin', 'manager', 'staff'],
            default: 'staff',
        },
        isLocked: { type: Boolean, default: false },
        typeLogin: { type: String, enum: ['email', 'google'], default: 'email' },
        avatar: { type: String, default: '' },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('user', modelUser);
