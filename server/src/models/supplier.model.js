const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const supplierSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        code: { type: String, unique: true, trim: true },
        contactPerson: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
        address: { type: String, default: '' },
        taxCode: { type: String, default: '' },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        note: { type: String, default: '' },
    },
    {
        timestamps: true,
    },
);

// Auto-gen mã nhà cung cấp
supplierSchema.pre('save', async function (next) {
    if (!this.code) {
        const count = await mongoose.model('supplier').countDocuments();
        this.code = `NCC${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('supplier', supplierSchema);
