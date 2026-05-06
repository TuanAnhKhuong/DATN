const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * Schema chi tiết phiếu nhập — mỗi dòng là 1 sản phẩm
 */
const importItemSchema = new Schema(
    {
        product: { type: Schema.Types.ObjectId, ref: 'product', required: true },
        productName: { type: String, default: '' }, // Lưu snapshot tên SP
        sku: { type: String, default: '' },
        quantity: { type: Number, required: true, min: 1 },
        importPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, default: 0 },
    },
    { _id: true },
);

/**
 * Schema phiếu nhập kho
 */
const importSchema = new Schema(
    {
        // Mã phiếu nhập (auto-gen: PN00001)
        code: { type: String, unique: true, trim: true },

        // Nhà cung cấp
        supplier: { type: Schema.Types.ObjectId, ref: 'supplier', required: true, index: true },

        // Chi tiết sản phẩm nhập
        items: [importItemSchema],

        // Tổng tiền
        totalAmount: { type: Number, default: 0 },
        totalItems: { type: Number, default: 0 },

        // Trạng thái phiếu
        status: {
            type: String,
            enum: ['draft', 'pending', 'completed', 'cancelled'],
            default: 'pending',
            index: true,
        },

        // Ngày nhập kho thực tế (người dùng chọn, mặc định là ngày tạo phiếu)
        importDate: { type: Date, default: null },

        // Ghi chú
        note: { type: String, default: '' },

        // Người tạo
        createdBy: { type: Schema.Types.ObjectId, ref: 'user', index: true },
    },
    {
        timestamps: true,
    },
);

// Compound indexes
importSchema.index({ status: 1, createdAt: -1 });
importSchema.index({ supplier: 1, status: 1 });

// Auto-gen mã phiếu nhập
importSchema.pre('save', async function (next) {
    if (!this.code) {
        const count = await mongoose.model('import').countDocuments();
        this.code = `PN${String(count + 1).padStart(5, '0')}`;
    }
    // Tính tổng tiền + tổng SL
    if (this.items && this.items.length > 0) {
        this.items.forEach((item) => {
            item.totalPrice = item.quantity * item.importPrice;
        });
        this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
        this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    next();
});

module.exports = mongoose.model('import', importSchema);
