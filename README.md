# 📦 Hệ Thống Quản Lý Kho Hàng

Hệ thống quản lý kho hàng toàn diện được xây dựng với **ReactJS**, **Node.js**, **MongoDB**, **TailwindCSS** và **Ant Design**.

---

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Cài Đặt & Chạy Dự Án](#cài-đặt--chạy-dự-án)
- [Biến Môi Trường](#biến-môi-trường)
- [Tính Năng](#tính-năng)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)

---

## 🎯 Tổng Quan

Hệ thống Quản lý kho hàng hỗ trợ doanh nghiệp quản lý toàn bộ quy trình nhập kho, xuất kho, tồn kho, sản phẩm, nhà cung cấp, và tạo báo cáo thống kê. Hệ thống có phân quyền rõ ràng và tích hợp AI chatbot hỗ trợ gợi ý nhập hàng.

---

## 🛠 Công Nghệ Sử Dụng

### Frontend
| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| **React.js** | ^18.x | Thư viện xây dựng giao diện |
| **Vite** | ^5.x | Build tool nhanh cho React |
| **TailwindCSS** | ^3.x | Framework CSS utility-first |
| **Ant Design** | ^5.x | Bộ UI components chuyên nghiệp |
| **Axios** | ^1.x | HTTP client cho API calls |
| **React Router** | ^6.x | Điều hướng trang SPA |
| **Recharts** | ^2.x | Thư viện biểu đồ |
| **xlsx** | ^0.18.x | Đọc/ghi file Excel |
| **jspdf** | ^2.x | Xuất file PDF |
| **html5-qrcode** | ^2.x | Quét mã QR/Barcode |
| **React Toastify** | ^9.x | Thông báo toast |

### Backend
| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| **Node.js** | ^18.x | Runtime JavaScript |
| **Express.js** | ^4.x | Web framework |
| **MongoDB** | ^7.x | Cơ sở dữ liệu NoSQL |
| **Mongoose** | ^8.x | ODM cho MongoDB |
| **JWT** | ^9.x | Xác thực token |
| **Bcrypt** | ^5.x | Mã hóa mật khẩu |
| **Multer** | ^1.x | Upload file |
| **Cloudinary** | ^1.x | Lưu trữ hình ảnh |
| **Nodemailer** | ^6.x | Gửi email (quên mật khẩu) |
| **Groq SDK** | latest | AI chatbot |

---

## 📁 Cấu Trúc Dự Án

```
Quản lý kho/
├── client/                     # Frontend (React + Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/                # Axios instances & API calls
│   │   │   └── axiosClient.js
│   │   ├── assets/             # Hình ảnh, icons
│   │   ├── components/         # Components dùng chung
│   │   │   ├── Layout/
│   │   │   │   ├── MainLayout.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Header.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/              # Các trang chính
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── ForgotPassword.jsx
│   │   │   ├── Dashboard/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── Products/
│   │   │   │   ├── ProductList.jsx
│   │   │   │   ├── ProductForm.jsx
│   │   │   │   └── ProductDetail.jsx
│   │   │   ├── Categories/
│   │   │   │   └── CategoryList.jsx
│   │   │   ├── Suppliers/
│   │   │   │   ├── SupplierList.jsx
│   │   │   │   └── SupplierForm.jsx
│   │   │   ├── Import/           # Nhập kho
│   │   │   │   ├── ImportList.jsx
│   │   │   │   └── ImportForm.jsx
│   │   │   ├── Export/           # Xuất kho
│   │   │   │   ├── ExportList.jsx
│   │   │   │   └── ExportForm.jsx
│   │   │   ├── Inventory/        # Tồn kho
│   │   │   │   └── InventoryList.jsx
│   │   │   ├── Orders/           # Đơn hàng (optional)
│   │   │   │   └── OrderList.jsx
│   │   │   ├── Reports/          # Thống kê báo cáo
│   │   │   │   └── Reports.jsx
│   │   │   ├── Users/            # Quản lý tài khoản
│   │   │   │   └── UserManagement.jsx
│   │   │   └── AIChat/
│   │   │       └── AIChatbot.jsx
│   │   ├── context/            # React Context (Auth, Theme)
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/              # Custom hooks
│   │   ├── utils/              # Hàm tiện ích
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # TailwindCSS imports
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Backend (Node.js + Express)
│   ├── config/
│   │   ├── db.js               # Kết nối MongoDB
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── supplierController.js
│   │   ├── importController.js
│   │   ├── exportController.js
│   │   ├── inventoryController.js
│   │   ├── orderController.js
│   │   ├── reportController.js
│   │   └── aiController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Supplier.js
│   │   ├── ImportReceipt.js
│   │   ├── ExportReceipt.js
│   │   ├── Order.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── productRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── supplierRoutes.js
│   │   ├── importRoutes.js
│   │   ├── exportRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── reportRoutes.js
│   │   └── aiRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js   # Xác thực JWT
│   │   └── roleMiddleware.js   # Phân quyền
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── sendEmail.js
│   ├── server.js               # Entry point
│   └── package.json
│
├── .gitignore
├── README.md
└── text.txt
```

---

## 🚀 Cài Đặt & Chạy Dự Án

### Yêu cầu
- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** (local hoặc MongoDB Atlas)

### Bước 1: Clone dự án

```bash
git clone <repository-url>
cd "Quản lý kho"
```

### Bước 2: Cài đặt Backend

```bash
cd server
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken multer cloudinary nodemailer cookie-parser express-validator
npm install -D nodemon
```

Thêm script vào `server/package.json`:
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

### Bước 3: Cài đặt Frontend

```bash
cd ../client
npm create vite@latest ./ -- --template react
npm install
npm install tailwindcss @tailwindcss/vite antd @ant-design/icons axios react-router-dom recharts xlsx jspdf html5-qrcode react-toastify dayjs
```

#### Cấu hình TailwindCSS (với Vite plugin)

Trong `vite.config.js`:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

Trong `src/index.css`:
```css
@import "tailwindcss";
```

### Bước 4: Cấu hình biến môi trường

Tạo file `.env` trong thư mục `server/`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/warehouse_management
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Groq AI
GROQ_API_KEY=your_groq_api_key
```

### Bước 5: Chạy dự án

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Truy cập: **http://localhost:3000**

---

## 🔑 Biến Môi Trường

| Biến | Mô tả | Bắt buộc |
|---|---|---|
| `PORT` | Port cho server (mặc định: 5000) | ✅ |
| `MONGODB_URI` | Connection string MongoDB | ✅ |
| `JWT_SECRET` | Secret key cho JWT | ✅ |
| `JWT_EXPIRE` | Thời gian hết hạn token | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `EMAIL_HOST` | SMTP host | ⚡ |
| `EMAIL_USER` | Email gửi thông báo | ⚡ |
| `EMAIL_PASS` | Mật khẩu ứng dụng email | ⚡ |
| `GROQ_API_KEY` | API key cho AI chatbot | ⚡ |

> ✅ = Bắt buộc | ⚡ = Cần cho tính năng cụ thể

---

## ✨ Tính Năng

### 1. 🔐 Quản lý tài khoản
- Đăng ký / Đăng nhập / Đăng xuất
- Quên mật khẩu (gửi email reset)
- Phân quyền: **Admin**, **Quản lý**, **Nhân viên kho**
- Quản lý hồ sơ, đổi mật khẩu, khóa/mở khóa tài khoản

### 2. 📦 Quản lý sản phẩm
- CRUD sản phẩm đầy đủ
- Thông tin: tên, SKU, hình ảnh, giá nhập/bán, tồn kho, danh mục, nhà cung cấp, mô tả
- Hỗ trợ mã QR & mã vạch (Barcode)
- Lọc theo danh mục, nhà cung cấp, tình trạng

### 3. 🏷 Quản lý danh mục
- CRUD danh mục sản phẩm

### 4. 🏢 Quản lý nhà cung cấp
- CRUD nhà cung cấp (tên, SĐT, email, địa chỉ)

### 5. 📥 Quản lý nhập kho
- Tạo phiếu nhập kho
- Chọn nhà cung cấp, sản phẩm, số lượng, giá nhập
- Xem lịch sử nhập kho, in phiếu nhập
- Tự động cập nhật tồn kho

### 6. 📤 Quản lý xuất kho
- Tạo phiếu xuất kho
- Kiểm tra tồn kho trước khi xuất
- Ghi chú lý do xuất
- Xem lịch sử xuất kho

### 7. 📊 Quản lý tồn kho
- Xem số lượng tồn theo sản phẩm
- Cảnh báo sắp hết hàng / tồn kho thấp
- Kiểm kê kho

### 8. 🛒 Quản lý đơn hàng *(optional)*
- Quản lý đơn nhập / đơn xuất
- Theo dõi trạng thái đơn

### 9. 📈 Thống kê & Báo cáo
- Thống kê nhập kho, xuất kho, tồn kho
- Top sản phẩm nhập/bán nhiều
- Biểu đồ trực quan (Recharts)

### 10. 🔍 Tìm kiếm thông minh
- Tìm theo tên, mã SKU, danh mục

### 11. 🔔 Thông báo
- Cảnh báo sắp hết hàng
- Cảnh báo hàng tồn lâu

### 12. 📂 Import / Export dữ liệu
- Import danh sách sản phẩm từ Excel
- Export báo cáo ra Excel / PDF

### 13. 🏠 Dashboard quản trị
- Tổng sản phẩm, tổng nhập/xuất kho
- Sản phẩm sắp hết hàng
- Biểu đồ nhập/xuất theo thời gian

### 14. 🤖 AI Chatbot
- Gợi ý nhập hàng dựa trên dữ liệu tồn kho
- Hỗ trợ trả lời câu hỏi về kho hàng

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký | Public |
| POST | `/api/auth/login` | Đăng nhập | Public |
| POST | `/api/auth/logout` | Đăng xuất | User |
| POST | `/api/auth/forgot-password` | Quên mật khẩu | Public |
| POST | `/api/auth/reset-password/:token` | Reset mật khẩu | Public |

### Users
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/users` | Danh sách users | Admin |
| GET | `/api/users/profile` | Thông tin cá nhân | User |
| PUT | `/api/users/profile` | Cập nhật hồ sơ | User |
| PUT | `/api/users/change-password` | Đổi mật khẩu | User |
| PUT | `/api/users/:id/lock` | Khóa/mở khóa tài khoản | Admin |

### Products
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/products` | Danh sách sản phẩm | User |
| GET | `/api/products/:id` | Chi tiết sản phẩm | User |
| POST | `/api/products` | Thêm sản phẩm | Quản lý+ |
| PUT | `/api/products/:id` | Sửa sản phẩm | Quản lý+ |
| DELETE | `/api/products/:id` | Xóa sản phẩm | Admin |
| GET | `/api/products/search` | Tìm kiếm sản phẩm | User |

### Categories
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/categories` | Danh sách danh mục | User |
| POST | `/api/categories` | Thêm danh mục | Quản lý+ |
| PUT | `/api/categories/:id` | Sửa danh mục | Quản lý+ |
| DELETE | `/api/categories/:id` | Xóa danh mục | Admin |

### Suppliers
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/suppliers` | Danh sách nhà cung cấp | User |
| POST | `/api/suppliers` | Thêm nhà cung cấp | Quản lý+ |
| PUT | `/api/suppliers/:id` | Sửa nhà cung cấp | Quản lý+ |
| DELETE | `/api/suppliers/:id` | Xóa nhà cung cấp | Admin |

### Import (Nhập kho)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/imports` | Lịch sử nhập kho | User |
| GET | `/api/imports/:id` | Chi tiết phiếu nhập | User |
| POST | `/api/imports` | Tạo phiếu nhập kho | Nhân viên+ |

### Export (Xuất kho)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/exports` | Lịch sử xuất kho | User |
| GET | `/api/exports/:id` | Chi tiết phiếu xuất | User |
| POST | `/api/exports` | Tạo phiếu xuất kho | Nhân viên+ |

### Inventory (Tồn kho)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/inventory` | Danh sách tồn kho | User |
| GET | `/api/inventory/low-stock` | Sản phẩm sắp hết | User |
| POST | `/api/inventory/stocktake` | Kiểm kê kho | Quản lý+ |

### Reports (Thống kê)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/reports/overview` | Tổng quan | Quản lý+ |
| GET | `/api/reports/import-export` | Thống kê nhập/xuất | Quản lý+ |
| GET | `/api/reports/top-products` | Top sản phẩm | Quản lý+ |
| GET | `/api/reports/export-excel` | Xuất báo cáo Excel | Quản lý+ |
| GET | `/api/reports/export-pdf` | Xuất báo cáo PDF | Quản lý+ |

### AI Chatbot
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/ai/chat` | Chat với AI | User |
| GET | `/api/ai/suggestions` | Gợi ý nhập hàng | Quản lý+ |

---

## 🗄 Database Schema

### User
```js
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (enum: ['admin', 'manager', 'staff']),
  isLocked: Boolean (default: false),
  avatar: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Product
```js
{
  name: String,
  sku: String (unique),        // Mã sản phẩm
  image: String,               // URL Cloudinary
  importPrice: Number,         // Giá nhập
  salePrice: Number,           // Giá bán
  quantity: Number,            // Số lượng tồn
  category: ObjectId (ref: Category),
  supplier: ObjectId (ref: Supplier),
  description: String,
  qrCode: String,
  barcode: String,
  minStock: Number,            // Ngưỡng cảnh báo tồn kho thấp
  createdAt: Date,
  updatedAt: Date
}
```

### Category
```js
{
  name: String (unique),
  description: String,
  createdAt: Date
}
```

### Supplier
```js
{
  name: String,
  phone: String,
  email: String,
  address: String,
  createdAt: Date,
  updatedAt: Date
}
```

### ImportReceipt (Phiếu nhập kho)
```js
{
  code: String (unique),       // Mã phiếu nhập (auto-gen)
  supplier: ObjectId (ref: Supplier),
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    importPrice: Number
  }],
  totalAmount: Number,
  note: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

### ExportReceipt (Phiếu xuất kho)
```js
{
  code: String (unique),       // Mã phiếu xuất (auto-gen)
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number
  }],
  reason: String,              // Lý do xuất
  note: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

### Notification
```js
{
  type: String (enum: ['low_stock', 'overstock']),
  message: String,
  product: ObjectId (ref: Product),
  isRead: Boolean (default: false),
  createdAt: Date
}
```

---

## 👥 Phân Quyền

| Chức năng | Admin | Quản lý | Nhân viên kho |
|---|:---:|:---:|:---:|
| Quản lý tài khoản | ✅ | ❌ | ❌ |
| Khóa/mở khóa user | ✅ | ❌ | ❌ |
| Xóa sản phẩm | ✅ | ❌ | ❌ |
| Thêm/sửa sản phẩm | ✅ | ✅ | ❌ |
| Quản lý danh mục | ✅ | ✅ | ❌ |
| Quản lý nhà cung cấp | ✅ | ✅ | ❌ |
| Tạo phiếu nhập/xuất | ✅ | ✅ | ✅ |
| Xem tồn kho | ✅ | ✅ | ✅ |
| Kiểm kê kho | ✅ | ✅ | ❌ |
| Thống kê & báo cáo | ✅ | ✅ | ❌ |
| Xem dashboard | ✅ | ✅ | ✅ |
| AI Chatbot | ✅ | ✅ | ✅ |

---

## 🎨 Giao Diện

Dự án sử dụng kết hợp **TailwindCSS** và **Ant Design**:
- **TailwindCSS**: Layout, spacing, responsive, custom styling
- **Ant Design**: Table, Form, Modal, Button, Select, DatePicker, Notification, Menu, Layout...

### Theme Configuration (Ant Design)
```js
// src/main.jsx
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

<ConfigProvider
  locale={viVN}
  theme={{
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
    },
  }}
>
  <App />
</ConfigProvider>
```

---

## 📝 Lưu Ý Quan Trọng

1. **MongoDB**: Đảm bảo MongoDB đang chạy trước khi start server. Có thể dùng [MongoDB Atlas](https://www.mongodb.com/atlas) (miễn phí) nếu không muốn cài local.
2. **Cloudinary**: Đăng ký tài khoản miễn phí tại [cloudinary.com](https://cloudinary.com) để lưu trữ hình ảnh.
3. **Email**: Nếu dùng Gmail, cần tạo [App Password](https://myaccount.google.com/apppasswords) thay vì dùng mật khẩu thường.
4. **Groq AI**: Đăng ký API key miễn phí tại [console.groq.com](https://console.groq.com).

---

## 📄 License

Dự án phục vụ mục đích học tập.

---

> 🚀 **Bắt đầu**: Hãy thực hiện lần lượt từ Bước 1 → Bước 5 trong phần [Cài Đặt & Chạy Dự Án](#cài-đặt--chạy-dự-án) để khởi tạo dự án!
