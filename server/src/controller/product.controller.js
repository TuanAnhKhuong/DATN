const { OK, Created } = require('../core/success.response');
const ProductService = require('../services/product.service');

class ProductController {
    async create(req, res) {
        const product = await ProductService.createProduct(req.body);
        new Created({ message: 'Tạo sản phẩm thành công', metadata: product }).send(res);
    }

    async getAll(req, res) {
        const data = await ProductService.getAllProducts(req.query);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    async getById(req, res) {
        const product = await ProductService.getProductById(req.params.id);
        new OK({ message: 'success', metadata: product }).send(res);
    }

    async update(req, res) {
        const product = await ProductService.updateProduct(req.params.id, req.body);
        new OK({ message: 'Cập nhật sản phẩm thành công', metadata: product }).send(res);
    }

    async delete(req, res) {
        const product = await ProductService.deleteProduct(req.params.id);
        new OK({ message: 'Xóa sản phẩm thành công', metadata: product }).send(res);
    }

    async getLowStock(req, res) {
        const products = await ProductService.getLowStockProducts();
        new OK({ message: 'success', metadata: products }).send(res);
    }

    async getStats(req, res) {
        const stats = await ProductService.getProductStats();
        new OK({ message: 'success', metadata: stats }).send(res);
    }

    // Variant management
    async addVariant(req, res) {
        const product = await ProductService.addVariant(req.params.id, req.body);
        new OK({ message: 'Thêm biến thể thành công', metadata: product }).send(res);
    }

    async updateVariant(req, res) {
        const product = await ProductService.updateVariant(req.params.id, req.params.variantId, req.body);
        new OK({ message: 'Cập nhật biến thể thành công', metadata: product }).send(res);
    }

    async removeVariant(req, res) {
        const product = await ProductService.removeVariant(req.params.id, req.params.variantId);
        new OK({ message: 'Xóa biến thể thành công', metadata: product }).send(res);
    }

    // AI Recommendation
    async getRecommended(req, res) {
        const products = await ProductService.getRecommendedProducts(req.params.id, req.query.limit);
        new OK({ message: 'success', metadata: products }).send(res);
    }

    // Barcode lookup
    async lookupBarcode(req, res) {
        const product = await ProductService.findByBarcode(req.params.code);
        new OK({ message: 'success', metadata: product }).send(res);
    }
}

module.exports = new ProductController();
