const { OK } = require('../core/success.response');
const DashboardService = require('../services/dashboard.service');

class DashboardController {
    async getStats(req, res) {
        const data = await DashboardService.getStats();
        new OK({ message: 'success', metadata: data }).send(res);
    }
}

module.exports = new DashboardController();
