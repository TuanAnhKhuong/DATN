const { OK } = require('../core/success.response');
const InventoryService = require('../services/inventory.service');

class InventoryController {
    async getOverview(req, res) {
        const data = await InventoryService.getOverview();
        new OK({ message: 'success', metadata: data }).send(res);
    }
    async getStockList(req, res) {
        const data = await InventoryService.getStockList(req.query);
        new OK({ message: 'success', metadata: data }).send(res);
    }
    async getProductHistory(req, res) {
        const data = await InventoryService.getProductHistory(req.params.productId, req.query);
        new OK({ message: 'success', metadata: data }).send(res);
    }
}

module.exports = new InventoryController();
