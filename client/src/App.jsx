import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Main pages
import Dashboard from './pages/Dashboard/Dashboard';
import CategoryList from './pages/Categories/CategoryList';
import SupplierList from './pages/Suppliers/SupplierList';
import ProductList from './pages/Products/ProductList';
import BarcodeScanner from './pages/Barcode/BarcodeScanner';
import ImportList from './pages/Imports/ImportList';
import ExportList from './pages/Exports/ExportList';
import InventoryList from './pages/Inventory/InventoryList';
import Profile from './pages/Profile/Profile';
import DataManager from './pages/Data/DataManager';
import UserList from './pages/Users/UserList';
import AiChat from './pages/AiChat/AiChat';

// Placeholder component cho các trang chưa làm
const ComingSoon = ({ title }) => (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
        <div
            className="mb-4 flex items-center justify-center"
            style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                fontSize: 36,
            }}
        >
            🚧
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#1E293B' }}>
            {title}
        </h2>
        <p style={{ color: '#64748B' }}>Tính năng này đang được phát triển</p>
    </div>
);

function App() {
    return (
        <Routes>
            {/* Auth Routes - không cần đăng nhập */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes - cần đăng nhập */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />

                {/* Trang quản lý */}
                <Route path="products" element={<ProductList />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="suppliers" element={<SupplierList />} />
                <Route path="imports" element={<ImportList />} />
                <Route path="exports" element={<ExportList />} />
                <Route path="inventory" element={<InventoryList />} />
                <Route path="reports" element={<ComingSoon title="Thống kê & Báo cáo" />} />
                <Route path="search" element={<BarcodeScanner />} />
                <Route path="notifications" element={<ComingSoon title="Thông báo" />} />
                <Route path="data" element={<DataManager />} />
                <Route path="ai-chat" element={<AiChat />} />
                <Route path="profile" element={<Profile />} />
                <Route path="change-password" element={<Profile />} />

                {/* Admin only */}
                <Route
                    path="users"
                    element={
                        <ProtectedRoute roles={['admin']}>
                            <UserList />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
