import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const theme = {
    token: {
        colorPrimary: '#4F46E5',
        colorSuccess: '#10B981',
        colorWarning: '#F59E0B',
        colorError: '#EF4444',
        colorInfo: '#3B82F6',
        borderRadius: 10,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        colorBgContainer: '#FFFFFF',
        colorBgLayout: '#F8FAFC',
        colorBorder: '#E2E8F0',
        colorText: '#1E293B',
        colorTextSecondary: '#64748B',
    },
    components: {
        Button: {
            borderRadius: 8,
            controlHeight: 40,
            fontWeight: 500,
        },
        Input: {
            borderRadius: 8,
            controlHeight: 42,
        },
        Select: {
            borderRadius: 8,
            controlHeight: 42,
        },
        Card: {
            borderRadius: 12,
        },
        Table: {
            borderRadius: 12,
            headerBg: '#F1F5F9',
            headerColor: '#1E293B',
        },
        Menu: {
            itemBorderRadius: 8,
            itemMarginInline: 8,
            itemHeight: 44,
        },
    },
};

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <ConfigProvider locale={viVN} theme={theme}>
                <AuthProvider>
                    <App />
                    <ToastContainer
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        closeOnClick
                        pauseOnHover
                        theme="light"
                    />
                </AuthProvider>
            </ConfigProvider>
        </BrowserRouter>
    </StrictMode>,
);
