const userRoutes = require('./users.routes');
const categoryRoutes = require('./category.routes');
const supplierRoutes = require('./supplier.routes');
const productRoutes = require('./product.routes');
const uploadRoutes = require('./upload.routes');
const importRoutes = require('./import.routes');
const exportRoutes = require('./export.routes');
const inventoryRoutes = require('./inventory.routes');
const dashboardRoutes = require('./dashboard.routes');
const chatbotRoutes = require('./chatbot.routes');

function routes(app) {
    app.use('/api/users', userRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/suppliers', supplierRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/imports', importRoutes);
    app.use('/api/exports', exportRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/chatbot', chatbotRoutes);
}

module.exports = routes;
