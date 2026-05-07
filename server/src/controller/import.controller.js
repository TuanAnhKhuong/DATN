const { OK, Created } = require('../core/success.response');
const ImportService = require('../services/import.service');

class ImportController {
    async create(req, res) {
        const importDoc = await ImportService.createImport(req.body, req.user.id);
        new Created({ message: 'Tạo phiếu nhập thành công', metadata: importDoc }).send(res);
    }

    async getAll(req, res) {
        const data = await ImportService.getAllImports(req.query);
        new OK({ message: 'success', metadata: data }).send(res);
    }

    async getById(req, res) {
        const importDoc = await ImportService.getImportById(req.params.id);
        new OK({ message: 'success', metadata: importDoc }).send(res);
    }

    async approve(req, res) {
        const importDoc = await ImportService.approveImport(req.params.id);
        new OK({ message: 'Duyệt phiếu nhập thành công', metadata: importDoc }).send(res);
    }

    async cancel(req, res) {
        const importDoc = await ImportService.cancelImport(req.params.id);
        new OK({ message: 'Hủy phiếu nhập thành công', metadata: importDoc }).send(res);
    }

    async getStats(req, res) {
        const stats = await ImportService.getImportStats();
        new OK({ message: 'success', metadata: stats }).send(res);
    }
}

module.exports = new ImportController();
