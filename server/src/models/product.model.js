const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * Schema biến thể sản phẩm
 * VD: iPhone 15 Pro có variant: 256GB Đen, 512GB Trắng
 *     Áo thun có variant: S Đỏ, M Xanh, L Trắng
 */
const variantSchema = new Schema(
    {
        sku: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true }, // "256GB - Đen", "Size M - Đỏ"
        importPrice: { type: Number, required: true, min: 0 },
        salePrice: { type: Number, required: true, min: 0 },
        quantity: { type: Number, default: 0, min: 0 },
        image: { type: String, default: '' },
        barcode: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        // Thuộc tính riêng của biến thể (linh hoạt)
        // VD: { color: "Đen", storage: "256GB" } hoặc { size: "M", color: "Đỏ" }
        attributes: { type: Schema.Types.Mixed, default: {} },
    },
    { _id: true },
);

/**
 * Schema sản phẩm chính
 * Tối ưu cho: Filter, Search, AI recommendation, mở rộng linh hoạt
 */
const productSchema = new Schema(
    {
        // ===== THÔNG TIN CƠ BẢN (Kiểu rõ ràng) =====
        name: { type: String, required: true, trim: true, maxlength: 500 },
        slug: { type: String, unique: true, trim: true, index: true },
        sku: { type: String, unique: true, trim: true },
        description: { type: String, default: '', maxlength: 5000 },

        // ===== PHÂN LOẠI (ref + index cho filter nhanh) =====
        category: { type: Schema.Types.ObjectId, ref: 'category', required: true, index: true },
        supplier: { type: Schema.Types.ObjectId, ref: 'supplier', required: true, index: true },
        brand: { type: String, default: '', trim: true, index: true },

        // ===== GIÁ (kiểu Number rõ ràng cho filter range) =====
        importPrice: { type: Number, required: true, min: 0, index: true },
        salePrice: { type: Number, required: true, min: 0, index: true },
        discountPercent: { type: Number, default: 0, min: 0, max: 100 },

        // ===== TỒN KHO (kiểu Number rõ ràng) =====
        quantity: { type: Number, default: 0, min: 0, index: true },
        minStock: { type: Number, default: 10, min: 0 },
        unit: { type: String, default: 'Cái', trim: true },
        lastImportDate: { type: Date, default: null, index: true }, // Ngày nhập kho lần cuối

        // ===== HÌNH ẢNH (mảng String rõ ràng) =====
        thumbnail: { type: String, default: '' },
        images: [{ type: String }],

        // ===== THUỘC TÍNH VẬT LÝ (kiểu rõ ràng) =====
        weight: { type: Number, default: 0, min: 0 }, // gram
        origin: { type: String, default: '', trim: true },
        warranty: { type: String, default: '', trim: true },
        barcode: { type: String, default: '', trim: true, index: true },

        // ===== BIẾN THỂ - dành cho SP có nhiều phiên bản =====
        hasVariants: { type: Boolean, default: false },
        variants: [variantSchema],
        // Định nghĩa các trường biến thể cho SP này
        // VD: ["color", "size"] hoặc ["storage", "color"]
        variantFields: [{ type: String }],

        // ===== THUỘC TÍNH LINH HOẠT (Mixed - chỉ dùng ở đây) =====
        // Dùng cho thuộc tính đặc thù từng loại SP, không biết trước cấu trúc
        // VD điện thoại: { screenSize: "6.7 inch", ram: "8GB", cpu: "A17 Pro" }
        // VD giày: { material: "Da thật", soleMaterial: "Cao su", style: "Sneaker" }
        // VD quần áo: { fabric: "Cotton 100%", season: "Hè", gender: "Nam" }
        attributes: { type: Schema.Types.Mixed, default: {} },

        // ===== TAGS & SEO (cho tìm kiếm và AI) =====
        tags: [{ type: String, index: true }],
        // Từ khóa tìm kiếm tổng hợp (auto-gen từ name + brand + tags + attributes)
        searchKeywords: { type: String, default: '', index: 'text' },

        // ===== META CHO AI RECOMMENDATION =====
        // Số lượt xem, bán, đánh giá — phục vụ AI gợi ý
        viewCount: { type: Number, default: 0 },
        soldCount: { type: Number, default: 0 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        ratingCount: { type: Number, default: 0 },

        // ===== TRẠNG THÁI =====
        status: {
            type: String,
            enum: ['active', 'inactive', 'out_of_stock', 'draft'],
            default: 'active',
            index: true,
        },
        isFeatured: { type: Boolean, default: false, index: true },
    },
    {
        timestamps: true,
    },
);

// ===== INDEXES TỐI ƯU =====

// Compound index cho filter phổ biến: category + status + giá
productSchema.index({ category: 1, status: 1, salePrice: 1 });
// Compound index cho filter brand + category
productSchema.index({ brand: 1, category: 1, status: 1 });
// Index cho tìm kiếm text (name + searchKeywords)
productSchema.index(
    { name: 'text', searchKeywords: 'text', brand: 'text' },
    {
        weights: { name: 10, brand: 5, searchKeywords: 3 },
        name: 'product_text_search',
    },
);
// Index cho sản phẩm sắp hết hàng
productSchema.index({ quantity: 1, minStock: 1 });
// Index cho AI recommendation
productSchema.index({ soldCount: -1, rating: -1, viewCount: -1 });
// Index cho sản phẩm nổi bật
productSchema.index({ isFeatured: 1, status: 1 });

// ===== PRE-SAVE HOOKS =====

productSchema.pre('save', async function (next) {
    // Auto-gen SKU
   if (!this.sku) {
    const lastProduct = await mongoose
        .model('product')
        .findOne({ sku: /^SP\d+$/ })
        .sort({ sku: -1 });

    let nextNumber = 1;

    if (lastProduct?.sku) {
        nextNumber = parseInt(lastProduct.sku.replace('SP', ''), 10) + 1;
    }

    this.sku = `SP${String(nextNumber).padStart(5, '0')}`;
    }

    // Auto-gen slug từ name
    if (this.isModified('name') || !this.slug) {
        this.slug =
            this.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '') +
            '-' +
            Date.now().toString(36);
    }

    // Auto thumbnail = ảnh đầu tiên
    if (this.images && this.images.length > 0 && !this.thumbnail) {
        this.thumbnail = this.images[0];
    }

    // Auto cập nhật trạng thái theo tồn kho
    if (this.status !== 'inactive' && this.status !== 'draft') {
        if (this.quantity <= 0 && !this.hasVariants) {
            this.status = 'out_of_stock';
        } else if (this.status === 'out_of_stock' && this.quantity > 0) {
            this.status = 'active';
        }
    }

    // Auto tính quantity từ tổng variants
    if (this.hasVariants && this.variants.length > 0) {
        this.quantity = this.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
    }

    // Auto-gen searchKeywords cho full-text search + AI
    const keywords = [this.name, this.brand, this.origin, ...(this.tags || [])];
    // Trích xuất giá trị từ attributes
    if (this.attributes && typeof this.attributes === 'object') {
        Object.values(this.attributes).forEach((val) => {
            if (typeof val === 'string') keywords.push(val);
        });
    }
    this.searchKeywords = keywords.filter(Boolean).join(' ');

    next();
});

// ===== VIRTUAL =====

// Lợi nhuận dự kiến
productSchema.virtual('profit').get(function () {
    return this.salePrice - this.importPrice;
});

// Giá sau giảm
productSchema.virtual('finalPrice').get(function () {
    if (this.discountPercent > 0) {
        return Math.round(this.salePrice * (1 - this.discountPercent / 100));
    }
    return this.salePrice;
});

// Sắp hết hàng?
productSchema.virtual('isLowStock').get(function () {
    return this.quantity <= this.minStock && this.quantity > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('product', productSchema);
