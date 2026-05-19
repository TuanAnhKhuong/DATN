const modelProduct = require('../models/product.model');
const modelImport = require('../models/import.model');
const modelExport = require('../models/export.model');
const modelCategory = require('../models/category.model');
const modelSupplier = require('../models/supplier.model');

class DashboardService {
    async getStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Tính start của 7 ngày gần nhất (từ 00:00:00 cách đây 6 ngày)
        const startOf7Days = new Date(now);
        startOf7Days.setDate(now.getDate() - 6);
        startOf7Days.setHours(0, 0, 0, 0);

        const [
            totalProducts,
            totalCategories,
            totalSuppliers,
            stockAgg,
            lowStock,
            outOfStock,
            importThisMonth,
            importLastMonth,
            exportThisMonth,
            exportLastMonth,
            topSelling,
            recentImports,
            recentExports,
            importByMonth,
            exportByMonth,
            categoryStock,
            importByDay,
            exportByDay,
            profitThisMonth,
        ] = await Promise.all([
            modelProduct.countDocuments({ status: { $ne: 'draft' } }),
            modelCategory.countDocuments(),
            modelSupplier.countDocuments({ status: 'active' }),
            // Tổng tồn + giá trị
            modelProduct.aggregate([
                { $match: { status: { $ne: 'draft' } } },
                {
                    $group: {
                        _id: null,
                        qty: { $sum: '$quantity' },
                        val: { $sum: { $multiply: ['$importPrice', '$quantity'] } },
                    },
                },
            ]),
            modelProduct.countDocuments({ $expr: { $lte: ['$quantity', '$minStock'] }, quantity: { $gt: 0 } }),
            modelProduct.countDocuments({ quantity: 0 }),
            // Nhập tháng này (dùng importDate, fallback createdAt)
            modelImport.aggregate([
                {
                    $addFields: {
                        effectiveDate: { $ifNull: ['$importDate', '$createdAt'] },
                    },
                },
                { $match: { status: 'completed', effectiveDate: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' },
                        count: { $sum: 1 },
                        items: { $sum: '$totalItems' },
                    },
                },
            ]),
            // Nhập tháng trước (dùng importDate, fallback createdAt)
            modelImport.aggregate([
                {
                    $addFields: {
                        effectiveDate: { $ifNull: ['$importDate', '$createdAt'] },
                    },
                },
                { $match: { status: 'completed', effectiveDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            // Xuất tháng này (theo exportDate hoặc createdAt)
            modelExport.aggregate([
                {
                    $addFields: {
                        effectiveDate: { $ifNull: ['$exportDate', '$createdAt'] },
                    },
                },
                { $match: { status: 'completed', effectiveDate: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' },
                        count: { $sum: 1 },
                        items: { $sum: '$totalItems' },
                    },
                },
            ]),
            // Xuất tháng trước
            modelExport.aggregate([
                {
                    $addFields: {
                        effectiveDate: { $ifNull: ['$exportDate', '$createdAt'] },
                    },
                },
                {
                    $match: {
                        status: 'completed',
                        effectiveDate: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                    },
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            // Top SP bán chạy
            modelProduct
                .find({ soldCount: { $gt: 0 } })
                .sort({ soldCount: -1 })
                .limit(10)
                .select('name sku thumbnail soldCount salePrice quantity unit')
                .lean(),
            // Phiếu nhập gần đây
            modelImport
                .find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('supplier', 'name')
                .select('code supplier totalAmount totalItems status createdAt')
                .lean(),
            // Phiếu xuất gần đây
            modelExport
                .find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('code type receiver totalAmount totalItems status createdAt')
                .lean(),
            // Nhập theo tháng (6 tháng - dùng importDate, fallback createdAt)
            modelImport.aggregate([
                {
                    $addFields: {
                        effectiveDate: { $ifNull: ['$importDate', '$createdAt'] },
                    },
                },
                {
                    $match: {
                        status: 'completed',
                        effectiveDate: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
                    },
                },
                {
                    $group: {
                        _id: { y: { $year: '$effectiveDate' }, m: { $month: '$effectiveDate' } },
                        total: { $sum: '$totalAmount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.y': 1, '_id.m': 1 } },
            ]),
            // Xuất theo tháng (6 tháng - dùng exportDate nếu có, fallback createdAt)
            modelExport.aggregate([
                {
                    $addFields: {
                        effectiveDate: { $ifNull: ['$exportDate', '$createdAt'] },
                    },
                },
                {
                    $match: {
                        status: 'completed',
                        effectiveDate: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
                    },
                },
                {
                    $group: {
                        _id: { y: { $year: '$effectiveDate' }, m: { $month: '$effectiveDate' } },
                        total: { $sum: '$totalAmount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.y': 1, '_id.m': 1 } },
            ]),
            // Tồn kho theo danh mục
            modelProduct.aggregate([
                { $match: { status: { $ne: 'draft' } } },
                { $group: { _id: '$category', qty: { $sum: '$quantity' }, count: { $sum: 1 } } },
                { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
                { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
                { $project: { name: { $ifNull: ['$cat.name', 'Khác'] }, qty: 1, count: 1 } },
                { $sort: { qty: -1 } },
            ]),
            // Nhập theo ngày (7 ngày - dùng importDate, fallback createdAt)
            modelImport.aggregate([
                {
                    $addFields: {
                        effectiveDate: { $ifNull: ['$importDate', '$createdAt'] },
                    },
                },
                { $match: { status: 'completed', effectiveDate: { $gte: startOf7Days } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$effectiveDate', timezone: '+07:00' } },
                        total: { $sum: '$totalAmount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            // Xuất theo ngày (7 ngày - dùng exportDate, fallback createdAt)
            modelExport.aggregate([
                {
                    $addFields: {
                        effectiveDate: { $ifNull: ['$exportDate', '$createdAt'] },
                    },
                },
                { $match: { status: 'completed', effectiveDate: { $gte: startOf7Days } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$effectiveDate', timezone: '+07:00' } },
                        total: { $sum: '$totalAmount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            // Lợi nhuận tháng này = (giá xuất - giá nhập) * số lượng xuất
            modelExport.aggregate([
                {
                    $addFields: {
                        effectiveDate: { $ifNull: ['$exportDate', '$createdAt'] },
                    },
                },
                {
                    $match: {
                        status: 'completed',
                        effectiveDate: { $gte: startOfMonth },
                    },
                },
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.product',
                        foreignField: '_id',
                        as: 'productInfo',
                    },
                },
                {
                    $unwind: {
                        path: '$productInfo',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $group: {
                        _id: null,
                        profit: {
                            $sum: {
                                $multiply: [
                                    {
                                        $subtract: [
                                            '$items.exportPrice',
                                            {
                                                $ifNull: ['$productInfo.importPrice', 0],
                                            },
                                        ],
                                    },
                                    '$items.quantity',
                                ],
                            },
                        },
                    },
                },
            ]),
        ]);

        // Build monthly chart data (6 tháng)
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ y: d.getFullYear(), m: d.getMonth() + 1, label: `T${d.getMonth() + 1}` });
        }
        const chartData = months.map((m) => {
            const imp = importByMonth.find((x) => x._id.y === m.y && x._id.m === m.m);
            const exp = exportByMonth.find((x) => x._id.y === m.y && x._id.m === m.m);
            return {
                month: m.label,
                import: imp?.total || 0,
                export: exp?.total || 0,
                importCount: imp?.count || 0,
                exportCount: exp?.count || 0,
            };
        });

        // Build weekly chart data (7 ngày gần nhất)
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            // Format YYYY-MM-DD theo timezone +07
            const tzOffset = 7 * 60;
            const localD = new Date(d.getTime() + tzOffset * 60000);
            const dateStr = localD.toISOString().slice(0, 10);
            const dayLabel = dayNames[d.getDay()];
            const imp = importByDay.find((x) => x._id === dateStr);
            const exp = exportByDay.find((x) => x._id === dateStr);
            weeklyData.push({
                day: dayLabel,
                date: dateStr,
                import: imp?.total || 0,
                export: exp?.total || 0,
                importCount: imp?.count || 0,
                exportCount: exp?.count || 0,
            });
        }

        const importTotal = importThisMonth[0]?.total || 0;
        const exportTotal = exportThisMonth[0]?.total || 0;
        const importLast = importLastMonth[0]?.total || 0;
        const exportLast = exportLastMonth[0]?.total || 0;

        return {
            overview: {
                totalProducts,
                totalCategories,
                totalSuppliers,
                totalQuantity: stockAgg[0]?.qty || 0,
                stockValue: stockAgg[0]?.val || 0,
                lowStock,
                outOfStock,
            },
            thisMonth: {
                importTotal,
                importCount: importThisMonth[0]?.count || 0,
                importItems: importThisMonth[0]?.items || 0,
                exportTotal,
                exportCount: exportThisMonth[0]?.count || 0,
                exportItems: exportThisMonth[0]?.items || 0,
                profit: profitThisMonth[0]?.profit || 0,
                importGrowth: importLast > 0 ? (((importTotal - importLast) / importLast) * 100).toFixed(1) : 0,
                exportGrowth: exportLast > 0 ? (((exportTotal - exportLast) / exportLast) * 100).toFixed(1) : 0,
            },
            topSelling,
            recentImports,
            recentExports,
            chartData,
            weeklyData,
            categoryStock,
        };
    }
}

module.exports = new DashboardService();