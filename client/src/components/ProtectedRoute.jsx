import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    console.log(user);

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
                <Spin size="large" tip="Đang tải..." />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra role nếu có yêu cầu
    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
