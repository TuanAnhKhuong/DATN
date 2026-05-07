const { OK, Created } = require('../core/success.response');
const SupplierService = require('../services/supplier.service');

class SupplierController {
    async create(req, res) {
        const supplier = await SupplierService.createSupplier(req.body);
        new Created({ message: 'Tạo nhà cung cấp thành công', metadata: supplier }).send(res);
    }

    async getAll(req, res) {
        const data = await SupplierService.getAllSuppliers(req.query);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    async getById(req, res) {
        const supplier = await SupplierService.getSupplierById(req.params.id);
        new OK({ message: 'success', metadata: supplier }).send(res);
    }

    async update(req, res) {
        const supplier = await SupplierService.updateSupplier(req.params.id, req.body);
        new OK({ message: 'Cập nhật nhà cung cấp thành công', metadata: supplier }).send(res);
    }

    async delete(req, res) {
        const supplier = await SupplierService.deleteSupplier(req.params.id);
        new OK({ message: 'Xóa nhà cung cấp thành công', metadata: supplier }).send(res);
    }

    async getSimpleList(req, res) {
        const suppliers = await SupplierService.getAllSuppliersSimple();
        new OK({ message: 'success', metadata: suppliers }).send(res);
    }
}

module.exports = new SupplierController();
