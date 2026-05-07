const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * Chi tiết phiếu xuất — mỗi dòng là 1 sản phẩm
 */
const exportItemSchema = new Schema(
    {
        product: { type: Schema.Types.ObjectId, ref: 'product', required: true },
        productName: { type: String, default: '' },
        sku: { type: String, default: '' },
        quantity: { type: Number, required: true, min: 1 },
        exportPrice: { type: Number, required: true, min: 0 }, // Giá xuất (giá bán)
        totalPrice: { type: Number, default: 0 },
    },
    { _id: true },
);

/**
 * Schema phiếu xuất kho
 */
const exportSchema = new Schema(
    {
        code: { type: String, unique: true, trim: true }, // Auto: PX00001
        // Lý do xuất
        type: {
            type: String,
            enum: ['sale', 'return_supplier', 'damaged', 'transfer', 'other'],
            default: 'sale',
            index: true,
        },
        // Người nhận / Khách hàng
        receiver: { type: String, default: '', trim: true },
        // Chi tiết SP
        items: [exportItemSchema],
        // Tổng
        totalAmount: { type: Number, default: 0 },
        totalItems: { type: Number, default: 0 },
        // Trạng thái
        status: {
            type: String,
            enum: ['draft', 'pending', 'completed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        note: { type: String, default: '' },
        // Ngày xuất kho thực tế (người dùng chọn, mặc định là ngày tạo phiếu)
        exportDate: { type: Date, default: null },
        createdBy: { type: Schema.Types.ObjectId, ref: 'user', index: true },
    },
    { timestamps: true },
);

exportSchema.index({ status: 1, createdAt: -1 });
exportSchema.index({ type: 1, status: 1 });

exportSchema.pre('save', async function (next) {
    if (!this.code) {
        const count = await mongoose.model('export').countDocuments();
        this.code = `PX${String(count + 1).padStart(5, '0')}`;
    }
    if (this.items && this.items.length > 0) {
        this.items.forEach((item) => {
            item.totalPrice = item.quantity * item.exportPrice;
        });
        this.totalAmount = this.items.reduce((sum, i) => sum + i.totalPrice, 0);
        this.totalItems = this.items.reduce((sum, i) => sum + i.quantity, 0);
    }
    next();
});

module.exports = mongoose.model('export', exportSchema);
