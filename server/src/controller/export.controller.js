const { OK, Created } = require('../core/success.response');
const ExportService = require('../services/export.service');

class ExportController {
    async create(req, res) {
        const doc = await ExportService.createExport(req.body, req.user.id);
        new Created({ message: 'Tạo phiếu xuất thành công', metadata: doc }).send(res);
    }
    async getAll(req, res) {
        const data = await ExportService.getAllExports(req.query);
        new OK({ message: 'success', metadata: data }).send(res);
    }
    async getById(req, res) {
        const doc = await ExportService.getExportById(req.params.id);
        new OK({ message: 'success', metadata: doc }).send(res);
    }
    async approve(req, res) {
        const doc = await ExportService.approveExport(req.params.id);
        new OK({ message: 'Duyệt phiếu xuất thành công', metadata: doc }).send(res);
    }
    async cancel(req, res) {
        const doc = await ExportService.cancelExport(req.params.id);
        new OK({ message: 'Hủy phiếu xuất thành công', metadata: doc }).send(res);
    }
    async getStats(req, res) {
        const stats = await ExportService.getExportStats();
        new OK({ message: 'success', metadata: stats }).send(res);
    }
}

module.exports = new ExportController();
