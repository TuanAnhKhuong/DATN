/**
 * Seed script: Tạo dữ liệu mẫu cho hệ thống quản lý kho
 * - 10 nhà cung cấp
 * - 15 danh mục
 * - 100 sản phẩm (không ảnh)
 *
 * Chạy: node src/seed/seed.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const modelCategory = require('../models/category.model');
const modelSupplier = require('../models/supplier.model');
const modelProduct = require('../models/product.model');

// ===== DỮ LIỆU NHÀ CUNG CẤP =====
const suppliersData = [
    { name: 'Công ty TNHH Samsung Vina', contactPerson: 'Nguyễn Văn An', phone: '0901234567', email: 'contact@samsungvina.vn', address: '2 Hai Bà Trưng, Quận 1, TP.HCM', taxCode: '0301234567', status: 'active', note: 'Nhà cung cấp điện thoại, TV, gia dụng' },
    { name: 'Apple Việt Nam', contactPerson: 'Trần Thị Bích', phone: '0912345678', email: 'supply@applevn.com', address: '123 Nguyễn Huệ, Quận 1, TP.HCM', taxCode: '0312345678', status: 'active', note: 'Nhà cung cấp iPhone, iPad, MacBook' },
    { name: 'Công ty CP Nike Việt Nam', contactPerson: 'Lê Minh Tuấn', phone: '0923456789', email: 'order@nikevn.com', address: '456 Lê Lợi, Quận 1, TP.HCM', taxCode: '0323456789', status: 'active', note: 'Giày dép, quần áo thể thao' },
    { name: 'Adidas Distribution', contactPerson: 'Phạm Hồng Đức', phone: '0934567890', email: 'supply@adidas.vn', address: '789 Trần Hưng Đạo, Quận 5, TP.HCM', taxCode: '0334567890', status: 'active', note: 'Giày dép, đồ thể thao' },
    { name: 'Xiaomi Việt Nam', contactPerson: 'Hoàng Thị Lan', phone: '0945678901', email: 'wholesale@xiaomivn.com', address: '321 Cách Mạng Tháng 8, Quận 10, TP.HCM', taxCode: '0345678901', status: 'active', note: 'Điện thoại, phụ kiện, smart home' },
    { name: 'Công ty TNHH Unilever Việt Nam', contactPerson: 'Nguyễn Thanh Hà', phone: '0956789012', email: 'b2b@unilevervn.com', address: '156 Nguyễn Lương Bằng, Quận 7, TP.HCM', taxCode: '0356789012', status: 'active', note: 'Mỹ phẩm, chăm sóc cá nhân' },
    { name: 'Tập đoàn Vinamilk', contactPerson: 'Đặng Văn Phúc', phone: '0967890123', email: 'order@vinamilk.com.vn', address: '10 Tân Trào, Quận 7, TP.HCM', taxCode: '0367890123', status: 'active', note: 'Sữa, thực phẩm dinh dưỡng' },
    { name: 'Công ty CP Thế Giới Di Động', contactPerson: 'Lý Thị Mai', phone: '0978901234', email: 'supply@tgdd.vn', address: '128 Trần Quang Khải, Quận 1, TP.HCM', taxCode: '0378901234', status: 'active', note: 'Phân phối điện tử, gia dụng' },
    { name: 'ZARA Fashion Việt Nam', contactPerson: 'Vũ Hoàng Nam', phone: '0989012345', email: 'wholesale@zaravn.com', address: '92 Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM', taxCode: '0389012345', status: 'active', note: 'Thời trang nam nữ cao cấp' },
    { name: 'Logitech Distribution VN', contactPerson: 'Trương Minh Khôi', phone: '0990123456', email: 'partner@logitechvn.com', address: '45 Pasteur, Quận 3, TP.HCM', taxCode: '0390123456', status: 'active', note: 'Phụ kiện máy tính, gaming' },
];

// ===== DỮ LIỆU DANH MỤC =====
const categoriesData = [
    { name: 'Điện thoại', description: 'Smartphone, điện thoại di động các loại', isActive: true },
    { name: 'Laptop & Máy tính', description: 'Laptop, PC, máy tính bảng', isActive: true },
    { name: 'Phụ kiện điện tử', description: 'Tai nghe, sạc, cáp, ốp lưng, chuột, bàn phím', isActive: true },
    { name: 'Giày thể thao', description: 'Giày chạy bộ, giày tập gym, sneaker', isActive: true },
    { name: 'Giày da & Giày tây', description: 'Giày công sở, giày da nam nữ', isActive: true },
    { name: 'Dép & Sandal', description: 'Dép quai hậu, sandal, dép xỏ ngón', isActive: true },
    { name: 'Áo nam', description: 'Áo thun, áo sơ mi, áo polo, áo khoác nam', isActive: true },
    { name: 'Áo nữ', description: 'Áo thun nữ, áo kiểu, áo khoác nữ', isActive: true },
    { name: 'Quần nam', description: 'Quần jean, quần kaki, quần short nam', isActive: true },
    { name: 'Quần nữ', description: 'Quần jean nữ, váy, chân váy', isActive: true },
    { name: 'Mỹ phẩm', description: 'Son, kem dưỡng, toner, serum', isActive: true },
    { name: 'Chăm sóc cá nhân', description: 'Dầu gội, sữa tắm, kem đánh răng', isActive: true },
    { name: 'Đồng hồ & Trang sức', description: 'Đồng hồ nam nữ, vòng tay, nhẫn', isActive: true },
    { name: 'Túi xách & Balo', description: 'Túi xách, balo, ví, cặp da', isActive: true },
    { name: 'Thực phẩm & Đồ uống', description: 'Sữa, nước giải khát, snack, thực phẩm chức năng', isActive: true },
];

// ===== HÀM TẠO SẢN PHẨM =====
const generateProducts = (categories, suppliers) => {
    const products = [];
    const catMap = {};
    categories.forEach((c) => { catMap[c.name] = c._id; });

    const supIds = suppliers.map((s) => s._id);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const roundPrice = (p) => Math.round(p / 1000) * 1000;

    const productTemplates = [
        // Điện thoại (12 SP)
        { cat: 'Điện thoại', name: 'iPhone 15 Pro Max 256GB', brand: 'Apple', importPrice: 28000000, salePrice: 32990000, unit: 'Chiếc', weight: 221, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { ram: '8GB', storage: '256GB', screenSize: '6.7 inch', cpu: 'A17 Pro', camera: '48MP', battery: '4441mAh' } },
        { cat: 'Điện thoại', name: 'iPhone 15 128GB', brand: 'Apple', importPrice: 18000000, salePrice: 22990000, unit: 'Chiếc', weight: 171, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { ram: '6GB', storage: '128GB', screenSize: '6.1 inch', cpu: 'A16 Bionic' } },
        { cat: 'Điện thoại', name: 'Samsung Galaxy S24 Ultra 512GB', brand: 'Samsung', importPrice: 27000000, salePrice: 33990000, unit: 'Chiếc', weight: 232, origin: 'Việt Nam', warranty: '12 tháng', attributes: { ram: '12GB', storage: '512GB', screenSize: '6.8 inch', cpu: 'Snapdragon 8 Gen 3' } },
        { cat: 'Điện thoại', name: 'Samsung Galaxy A55 5G', brand: 'Samsung', importPrice: 7500000, salePrice: 9990000, unit: 'Chiếc', weight: 213, origin: 'Việt Nam', warranty: '12 tháng', attributes: { ram: '8GB', storage: '128GB', screenSize: '6.6 inch' } },
        { cat: 'Điện thoại', name: 'Xiaomi 14 Ultra', brand: 'Xiaomi', importPrice: 20000000, salePrice: 24990000, unit: 'Chiếc', weight: 220, origin: 'Trung Quốc', warranty: '18 tháng', attributes: { ram: '16GB', storage: '512GB', screenSize: '6.73 inch', camera: 'Leica 50MP' } },
        { cat: 'Điện thoại', name: 'Xiaomi Redmi Note 13 Pro', brand: 'Xiaomi', importPrice: 5500000, salePrice: 7490000, unit: 'Chiếc', weight: 187, origin: 'Trung Quốc', warranty: '18 tháng', attributes: { ram: '8GB', storage: '128GB', screenSize: '6.67 inch' } },
        { cat: 'Điện thoại', name: 'OPPO Find X7 Ultra', brand: 'OPPO', importPrice: 19000000, salePrice: 23990000, unit: 'Chiếc', weight: 221, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { ram: '16GB', storage: '256GB' } },
        { cat: 'Điện thoại', name: 'OPPO Reno 11 5G', brand: 'OPPO', importPrice: 8000000, salePrice: 10990000, unit: 'Chiếc', weight: 184, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { ram: '12GB', storage: '256GB' } },
        { cat: 'Điện thoại', name: 'Samsung Galaxy Z Fold 5', brand: 'Samsung', importPrice: 32000000, salePrice: 40990000, unit: 'Chiếc', weight: 253, origin: 'Việt Nam', warranty: '12 tháng', attributes: { ram: '12GB', storage: '256GB', screenSize: '7.6 inch', type: 'Gập' } },
        { cat: 'Điện thoại', name: 'iPhone 14 128GB', brand: 'Apple', importPrice: 14000000, salePrice: 17990000, unit: 'Chiếc', weight: 172, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { ram: '6GB', storage: '128GB' } },
        { cat: 'Điện thoại', name: 'Realme GT 5 Pro', brand: 'Realme', importPrice: 10000000, salePrice: 13490000, unit: 'Chiếc', weight: 199, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { ram: '12GB', storage: '256GB', cpu: 'Snapdragon 8 Gen 3' } },
        { cat: 'Điện thoại', name: 'Vivo V30 5G', brand: 'Vivo', importPrice: 7000000, salePrice: 9990000, unit: 'Chiếc', weight: 186, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { ram: '12GB', storage: '256GB' } },

        // Laptop (6 SP)
        { cat: 'Laptop & Máy tính', name: 'MacBook Air M3 15 inch', brand: 'Apple', importPrice: 28000000, salePrice: 34990000, unit: 'Chiếc', weight: 1510, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { ram: '8GB', storage: '256GB SSD', cpu: 'Apple M3', screenSize: '15.3 inch' } },
        { cat: 'Laptop & Máy tính', name: 'MacBook Pro M3 Pro 14 inch', brand: 'Apple', importPrice: 40000000, salePrice: 49990000, unit: 'Chiếc', weight: 1610, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { ram: '18GB', storage: '512GB SSD', cpu: 'Apple M3 Pro' } },
        { cat: 'Laptop & Máy tính', name: 'Dell XPS 16 9640', brand: 'Dell', importPrice: 35000000, salePrice: 42990000, unit: 'Chiếc', weight: 2100, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { ram: '32GB', storage: '1TB SSD', cpu: 'Intel Core Ultra 9' } },
        { cat: 'Laptop & Máy tính', name: 'ASUS ROG Strix G16', brand: 'ASUS', importPrice: 30000000, salePrice: 37990000, unit: 'Chiếc', weight: 2500, origin: 'Trung Quốc', warranty: '24 tháng', attributes: { ram: '16GB', storage: '512GB SSD', cpu: 'Intel i9-14900HX', gpu: 'RTX 4070' } },
        { cat: 'Laptop & Máy tính', name: 'Lenovo ThinkPad X1 Carbon Gen 12', brand: 'Lenovo', importPrice: 32000000, salePrice: 39990000, unit: 'Chiếc', weight: 1240, origin: 'Trung Quốc', warranty: '36 tháng', attributes: { ram: '32GB', storage: '1TB SSD', cpu: 'Intel Core Ultra 7' } },
        { cat: 'Laptop & Máy tính', name: 'HP Pavilion 15', brand: 'HP', importPrice: 12000000, salePrice: 15990000, unit: 'Chiếc', weight: 1750, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { ram: '8GB', storage: '512GB SSD', cpu: 'Intel Core i5-1340P' } },

        // Phụ kiện điện tử (8 SP)
        { cat: 'Phụ kiện điện tử', name: 'AirPods Pro 2 USB-C', brand: 'Apple', importPrice: 4500000, salePrice: 6190000, unit: 'Chiếc', weight: 50, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { type: 'True Wireless', anc: 'Có', battery: '6 giờ' } },
        { cat: 'Phụ kiện điện tử', name: 'Samsung Galaxy Buds FE', brand: 'Samsung', importPrice: 1500000, salePrice: 2290000, unit: 'Chiếc', weight: 53, origin: 'Việt Nam', warranty: '12 tháng', attributes: { type: 'True Wireless', anc: 'Có' } },
        { cat: 'Phụ kiện điện tử', name: 'Logitech MX Master 3S', brand: 'Logitech', importPrice: 1800000, salePrice: 2490000, unit: 'Chiếc', weight: 141, origin: 'Trung Quốc', warranty: '24 tháng', attributes: { type: 'Chuột không dây', sensor: '8000 DPI' } },
        { cat: 'Phụ kiện điện tử', name: 'Logitech MX Keys S', brand: 'Logitech', importPrice: 2000000, salePrice: 2790000, unit: 'Chiếc', weight: 810, origin: 'Trung Quốc', warranty: '24 tháng', attributes: { type: 'Bàn phím không dây', layout: 'Full-size' } },
        { cat: 'Phụ kiện điện tử', name: 'Anker Nano 65W GaN', brand: 'Anker', importPrice: 500000, salePrice: 790000, unit: 'Chiếc', weight: 112, origin: 'Trung Quốc', warranty: '18 tháng', attributes: { type: 'Sạc nhanh', output: '65W', ports: 'USB-C x2' } },
        { cat: 'Phụ kiện điện tử', name: 'Cáp USB-C to USB-C Ugreen 100W 2m', brand: 'Ugreen', importPrice: 100000, salePrice: 199000, unit: 'Chiếc', weight: 42, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { type: 'Cáp sạc', length: '2m', output: '100W' } },
        { cat: 'Phụ kiện điện tử', name: 'Ốp lưng MagSafe iPhone 15 Pro Max', brand: 'Apple', importPrice: 800000, salePrice: 1290000, unit: 'Chiếc', weight: 28, origin: 'Trung Quốc', warranty: '6 tháng', attributes: { material: 'Silicone', magsafe: 'Có' } },
        { cat: 'Phụ kiện điện tử', name: 'Pin dự phòng Anker 20000mAh', brand: 'Anker', importPrice: 600000, salePrice: 990000, unit: 'Chiếc', weight: 340, origin: 'Trung Quốc', warranty: '18 tháng', attributes: { capacity: '20000mAh', output: '22.5W' } },

        // Giày thể thao (10 SP)
        { cat: 'Giày thể thao', name: 'Nike Air Max 90', brand: 'Nike', importPrice: 2200000, salePrice: 3290000, unit: 'Đôi', weight: 340, origin: 'Việt Nam', warranty: '6 tháng', attributes: { material: 'Da tổng hợp + Mesh', sole: 'Air Max', gender: 'Unisex' } },
        { cat: 'Giày thể thao', name: 'Nike Air Force 1 Low White', brand: 'Nike', importPrice: 1800000, salePrice: 2690000, unit: 'Đôi', weight: 360, origin: 'Việt Nam', warranty: '6 tháng', attributes: { material: 'Da thật', sole: 'Cao su', gender: 'Unisex', color: 'Trắng' } },
        { cat: 'Giày thể thao', name: 'Adidas Ultra Boost Light', brand: 'Adidas', importPrice: 2800000, salePrice: 3990000, unit: 'Đôi', weight: 290, origin: 'Trung Quốc', warranty: '6 tháng', attributes: { material: 'Primeknit', sole: 'Boost', gender: 'Nam', type: 'Chạy bộ' } },
        { cat: 'Giày thể thao', name: 'Adidas Stan Smith', brand: 'Adidas', importPrice: 1500000, salePrice: 2290000, unit: 'Đôi', weight: 310, origin: 'Việt Nam', warranty: '6 tháng', attributes: { material: 'Da tổng hợp', gender: 'Unisex', color: 'Trắng/Xanh' } },
        { cat: 'Giày thể thao', name: 'Nike Pegasus 41', brand: 'Nike', importPrice: 2000000, salePrice: 3090000, unit: 'Đôi', weight: 275, origin: 'Trung Quốc', warranty: '6 tháng', attributes: { type: 'Chạy bộ', cushion: 'React Foam', gender: 'Nam' } },
        { cat: 'Giày thể thao', name: 'New Balance 574', brand: 'New Balance', importPrice: 1600000, salePrice: 2390000, unit: 'Đôi', weight: 330, origin: 'Trung Quốc', warranty: '6 tháng', attributes: { material: 'Suede + Mesh', gender: 'Unisex' } },
        { cat: 'Giày thể thao', name: 'Converse Chuck Taylor All Star', brand: 'Converse', importPrice: 800000, salePrice: 1390000, unit: 'Đôi', weight: 400, origin: 'Việt Nam', warranty: '3 tháng', attributes: { material: 'Canvas', sole: 'Cao su', gender: 'Unisex' } },
        { cat: 'Giày thể thao', name: 'Puma RS-X Reinvention', brand: 'Puma', importPrice: 1800000, salePrice: 2590000, unit: 'Đôi', weight: 350, origin: 'Trung Quốc', warranty: '6 tháng', attributes: { material: 'Mesh + Da tổng hợp', gender: 'Nam' } },
        { cat: 'Giày thể thao', name: 'Nike Dunk Low Retro', brand: 'Nike', importPrice: 2000000, salePrice: 2890000, unit: 'Đôi', weight: 360, origin: 'Trung Quốc', warranty: '6 tháng', attributes: { material: 'Da thật', gender: 'Unisex' } },
        { cat: 'Giày thể thao', name: 'Adidas Samba OG', brand: 'Adidas', importPrice: 1700000, salePrice: 2490000, unit: 'Đôi', weight: 320, origin: 'Việt Nam', warranty: '6 tháng', attributes: { material: 'Da thật + Suede', gender: 'Unisex' } },

        // Giày da (4 SP)
        { cat: 'Giày da & Giày tây', name: 'Giày Oxford da bò thật', brand: 'Pierre Cardin', importPrice: 1200000, salePrice: 1890000, unit: 'Đôi', weight: 450, origin: 'Việt Nam', warranty: '6 tháng', attributes: { material: 'Da bò thật', gender: 'Nam', style: 'Oxford' } },
        { cat: 'Giày da & Giày tây', name: 'Giày cao gót 7cm da mềm', brand: 'Vascara', importPrice: 500000, salePrice: 890000, unit: 'Đôi', weight: 280, origin: 'Việt Nam', warranty: '3 tháng', attributes: { material: 'Da PU', heelHeight: '7cm', gender: 'Nữ' } },
        { cat: 'Giày da & Giày tây', name: 'Giày Loafer da nam', brand: 'Bata', importPrice: 600000, salePrice: 990000, unit: 'Đôi', weight: 380, origin: 'Việt Nam', warranty: '6 tháng', attributes: { material: 'Da bò', gender: 'Nam', style: 'Loafer' } },
        { cat: 'Giày da & Giày tây', name: 'Giày Derby da nâu công sở', brand: 'Pierre Cardin', importPrice: 1000000, salePrice: 1590000, unit: 'Đôi', weight: 430, origin: 'Việt Nam', warranty: '6 tháng', attributes: { material: 'Da bò thật', color: 'Nâu', gender: 'Nam' } },

        // Dép & Sandal (4 SP)
        { cat: 'Dép & Sandal', name: 'Dép Nike Benassi JDI', brand: 'Nike', importPrice: 400000, salePrice: 690000, unit: 'Đôi', weight: 180, origin: 'Trung Quốc', warranty: '3 tháng', attributes: { material: 'EVA', gender: 'Unisex' } },
        { cat: 'Dép & Sandal', name: 'Sandal Adidas Adilette', brand: 'Adidas', importPrice: 500000, salePrice: 790000, unit: 'Đôi', weight: 190, origin: 'Trung Quốc', warranty: '3 tháng', attributes: { material: 'Cao su', gender: 'Unisex' } },
        { cat: 'Dép & Sandal', name: 'Dép xỏ ngón Havaianas Brasil', brand: 'Havaianas', importPrice: 250000, salePrice: 450000, unit: 'Đôi', weight: 120, origin: 'Brazil', warranty: '3 tháng', attributes: { material: 'Cao su tự nhiên', gender: 'Unisex' } },
        { cat: 'Dép & Sandal', name: 'Sandal quai hậu Shondo', brand: 'Shondo', importPrice: 350000, salePrice: 599000, unit: 'Đôi', weight: 200, origin: 'Việt Nam', warranty: '6 tháng', attributes: { material: 'EVA + Vải', gender: 'Unisex' } },

        // Áo nam (8 SP)
        { cat: 'Áo nam', name: 'Áo thun Cotton nam cổ tròn', brand: 'Uniqlo', importPrice: 150000, salePrice: 299000, unit: 'Chiếc', weight: 180, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Cotton 100%', gender: 'Nam', season: '4 mùa' } },
        { cat: 'Áo nam', name: 'Áo Polo Pique Classic Fit', brand: 'Lacoste', importPrice: 1200000, salePrice: 1890000, unit: 'Chiếc', weight: 200, origin: 'Peru', warranty: '', attributes: { fabric: 'Cotton Pique', gender: 'Nam' } },
        { cat: 'Áo nam', name: 'Áo sơ mi Oxford dài tay', brand: 'Routine', importPrice: 250000, salePrice: 450000, unit: 'Chiếc', weight: 220, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Cotton Oxford', gender: 'Nam', sleeve: 'Dài tay' } },
        { cat: 'Áo nam', name: 'Áo khoác hoodie basic', brand: 'H&M', importPrice: 350000, salePrice: 599000, unit: 'Chiếc', weight: 450, origin: 'Bangladesh', warranty: '', attributes: { fabric: 'Cotton Blend', gender: 'Nam', type: 'Hoodie' } },
        { cat: 'Áo nam', name: 'Áo thun thể thao Dri-FIT', brand: 'Nike', importPrice: 500000, salePrice: 790000, unit: 'Chiếc', weight: 140, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Polyester Dri-FIT', gender: 'Nam', type: 'Thể thao' } },
        { cat: 'Áo nam', name: 'Áo blazer nam một hàng nút', brand: 'Zara', importPrice: 800000, salePrice: 1490000, unit: 'Chiếc', weight: 500, origin: 'Maroc', warranty: '', attributes: { fabric: 'Polyester Blend', gender: 'Nam', type: 'Blazer' } },
        { cat: 'Áo nam', name: 'Áo vest công sở Slim Fit', brand: 'Aristino', importPrice: 600000, salePrice: 990000, unit: 'Chiếc', weight: 400, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Polyester + Wool', gender: 'Nam' } },
        { cat: 'Áo nam', name: 'Áo thun oversize Streetwear', brand: 'Local Brand', importPrice: 200000, salePrice: 390000, unit: 'Chiếc', weight: 250, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Cotton 95% Spandex 5%', gender: 'Unisex', fit: 'Oversize' } },

        // Áo nữ (6 SP)
        { cat: 'Áo nữ', name: 'Áo kiểu nữ cổ V xếp ly', brand: 'Zara', importPrice: 400000, salePrice: 790000, unit: 'Chiếc', weight: 150, origin: 'Thổ Nhĩ Kỳ', warranty: '', attributes: { fabric: 'Polyester', gender: 'Nữ' } },
        { cat: 'Áo nữ', name: 'Áo croptop thun gân', brand: 'H&M', importPrice: 120000, salePrice: 249000, unit: 'Chiếc', weight: 100, origin: 'Bangladesh', warranty: '', attributes: { fabric: 'Cotton Ribbed', gender: 'Nữ', type: 'Croptop' } },
        { cat: 'Áo nữ', name: 'Áo sơ mi lụa nữ', brand: 'MWC', importPrice: 200000, salePrice: 399000, unit: 'Chiếc', weight: 120, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Lụa tơ tằm', gender: 'Nữ' } },
        { cat: 'Áo nữ', name: 'Áo len cổ lọ nữ', brand: 'Uniqlo', importPrice: 350000, salePrice: 590000, unit: 'Chiếc', weight: 280, origin: 'Trung Quốc', warranty: '', attributes: { fabric: 'Merino Wool', gender: 'Nữ', season: 'Đông' } },
        { cat: 'Áo nữ', name: 'Áo khoác denim nữ', brand: 'Levis', importPrice: 900000, salePrice: 1590000, unit: 'Chiếc', weight: 600, origin: 'Bangladesh', warranty: '', attributes: { fabric: 'Denim Cotton', gender: 'Nữ' } },
        { cat: 'Áo nữ', name: 'Áo cardigan len mỏng nữ', brand: 'MUJI', importPrice: 450000, salePrice: 790000, unit: 'Chiếc', weight: 200, origin: 'Trung Quốc', warranty: '', attributes: { fabric: 'Cotton Blend', gender: 'Nữ', type: 'Cardigan' } },

        // Quần nam (6 SP)
        { cat: 'Quần nam', name: 'Quần jean Slim Fit xanh đậm', brand: 'Levis', importPrice: 800000, salePrice: 1390000, unit: 'Chiếc', weight: 600, origin: 'Bangladesh', warranty: '', attributes: { fabric: 'Denim Stretch', fit: 'Slim Fit', gender: 'Nam' } },
        { cat: 'Quần nam', name: 'Quần kaki nam Regular', brand: 'Routine', importPrice: 300000, salePrice: 550000, unit: 'Chiếc', weight: 400, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Cotton Kaki', fit: 'Regular', gender: 'Nam' } },
        { cat: 'Quần nam', name: 'Quần short thể thao', brand: 'Nike', importPrice: 350000, salePrice: 590000, unit: 'Chiếc', weight: 180, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Polyester Dri-FIT', gender: 'Nam', type: 'Short' } },
        { cat: 'Quần nam', name: 'Quần jogger nam', brand: 'Adidas', importPrice: 600000, salePrice: 990000, unit: 'Chiếc', weight: 350, origin: 'Trung Quốc', warranty: '', attributes: { fabric: 'Cotton French Terry', gender: 'Nam', type: 'Jogger' } },
        { cat: 'Quần nam', name: 'Quần tây Slim công sở', brand: 'Aristino', importPrice: 400000, salePrice: 690000, unit: 'Chiếc', weight: 400, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Polyester + Viscose', fit: 'Slim', gender: 'Nam' } },
        { cat: 'Quần nam', name: 'Quần jean skinny đen', brand: 'Zara', importPrice: 500000, salePrice: 890000, unit: 'Chiếc', weight: 550, origin: 'Thổ Nhĩ Kỳ', warranty: '', attributes: { fabric: 'Denim Stretch', fit: 'Skinny', color: 'Đen', gender: 'Nam' } },

        // Quần nữ (6 SP)
        { cat: 'Quần nữ', name: 'Quần jean nữ boyfriend rách', brand: 'Levis', importPrice: 700000, salePrice: 1190000, unit: 'Chiếc', weight: 550, origin: 'Bangladesh', warranty: '', attributes: { fabric: 'Denim', fit: 'Boyfriend', gender: 'Nữ' } },
        { cat: 'Quần nữ', name: 'Váy midi xếp ly', brand: 'Zara', importPrice: 500000, salePrice: 890000, unit: 'Chiếc', weight: 200, origin: 'Maroc', warranty: '', attributes: { fabric: 'Polyester', type: 'Váy midi', gender: 'Nữ' } },
        { cat: 'Quần nữ', name: 'Chân váy chữ A công sở', brand: 'MWC', importPrice: 200000, salePrice: 390000, unit: 'Chiếc', weight: 180, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Polyester Blend', gender: 'Nữ' } },
        { cat: 'Quần nữ', name: 'Quần legging thể thao nữ', brand: 'Nike', importPrice: 500000, salePrice: 890000, unit: 'Chiếc', weight: 200, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Nylon Spandex', gender: 'Nữ', type: 'Legging' } },
        { cat: 'Quần nữ', name: 'Quần culottes nữ ống rộng', brand: 'Uniqlo', importPrice: 350000, salePrice: 599000, unit: 'Chiếc', weight: 250, origin: 'Việt Nam', warranty: '', attributes: { fabric: 'Linen Blend', gender: 'Nữ', fit: 'Ống rộng' } },
        { cat: 'Quần nữ', name: 'Quần short jean nữ cạp cao', brand: 'H&M', importPrice: 250000, salePrice: 449000, unit: 'Chiếc', weight: 300, origin: 'Bangladesh', warranty: '', attributes: { fabric: 'Denim', gender: 'Nữ', type: 'Short' } },

        // Mỹ phẩm (8 SP)
        { cat: 'Mỹ phẩm', name: 'Son YSL Rouge Pur Couture', brand: 'YSL', importPrice: 600000, salePrice: 990000, unit: 'Chiếc', weight: 30, origin: 'Pháp', warranty: '24 tháng', attributes: { type: 'Son thỏi', finish: 'Satin' } },
        { cat: 'Mỹ phẩm', name: 'Kem chống nắng Anessa', brand: 'Anessa', importPrice: 350000, salePrice: 590000, unit: 'Chai', weight: 60, origin: 'Nhật Bản', warranty: '36 tháng', attributes: { spf: 'SPF50+ PA++++', volume: '60ml' } },
        { cat: 'Mỹ phẩm', name: 'Serum Vitamin C Klairs', brand: 'Klairs', importPrice: 250000, salePrice: 420000, unit: 'Chai', weight: 35, origin: 'Hàn Quốc', warranty: '24 tháng', attributes: { volume: '35ml', ingredient: 'Ascorbic Acid 5%' } },
        { cat: 'Mỹ phẩm', name: 'Kem dưỡng ẩm Laneige', brand: 'Laneige', importPrice: 400000, salePrice: 690000, unit: 'Hộp', weight: 50, origin: 'Hàn Quốc', warranty: '36 tháng', attributes: { volume: '50ml', type: 'Sleeping Mask' } },
        { cat: 'Mỹ phẩm', name: 'Toner Hada Labo Gokujyun', brand: 'Hada Labo', importPrice: 180000, salePrice: 299000, unit: 'Chai', weight: 170, origin: 'Nhật Bản', warranty: '36 tháng', attributes: { volume: '170ml', ingredient: 'Hyaluronic Acid' } },
        { cat: 'Mỹ phẩm', name: 'Cushion Maybelline Fit Me', brand: 'Maybelline', importPrice: 150000, salePrice: 269000, unit: 'Chiếc', weight: 15, origin: 'Trung Quốc', warranty: '24 tháng', attributes: { spf: 'SPF50', coverage: 'Medium' } },
        { cat: 'Mỹ phẩm', name: 'Mascara Maybelline Lash Sensational', brand: 'Maybelline', importPrice: 120000, salePrice: 219000, unit: 'Chiếc', weight: 10, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { type: 'Mascara', effect: 'Dày + Dài' } },
        { cat: 'Mỹ phẩm', name: 'Phấn phủ Innisfree No Sebum', brand: 'Innisfree', importPrice: 100000, salePrice: 185000, unit: 'Chiếc', weight: 5, origin: 'Hàn Quốc', warranty: '24 tháng', attributes: { type: 'Phấn bột', weight_product: '5g' } },

        // Chăm sóc cá nhân (6 SP)
        { cat: 'Chăm sóc cá nhân', name: 'Dầu gội Clear Men Cool Sport', brand: 'Clear', importPrice: 60000, salePrice: 109000, unit: 'Chai', weight: 650, origin: 'Việt Nam', warranty: '24 tháng', attributes: { volume: '650ml', gender: 'Nam' } },
        { cat: 'Chăm sóc cá nhân', name: 'Sữa tắm Dove Beauty Bar', brand: 'Dove', importPrice: 40000, salePrice: 79000, unit: 'Chai', weight: 500, origin: 'Việt Nam', warranty: '24 tháng', attributes: { volume: '500ml' } },
        { cat: 'Chăm sóc cá nhân', name: 'Kem đánh răng Sensodyne', brand: 'Sensodyne', importPrice: 45000, salePrice: 82000, unit: 'Tuýp', weight: 100, origin: 'Thái Lan', warranty: '36 tháng', attributes: { volume: '100g', type: 'Chống ê buốt' } },
        { cat: 'Chăm sóc cá nhân', name: 'Nước hoa Dior Sauvage EDT', brand: 'Dior', importPrice: 1800000, salePrice: 2790000, unit: 'Chai', weight: 100, origin: 'Pháp', warranty: '36 tháng', attributes: { volume: '100ml', type: 'EDT', gender: 'Nam' } },
        { cat: 'Chăm sóc cá nhân', name: 'Lăn khử mùi Nivea Men', brand: 'Nivea', importPrice: 40000, salePrice: 69000, unit: 'Chai', weight: 50, origin: 'Thái Lan', warranty: '24 tháng', attributes: { volume: '50ml', gender: 'Nam' } },
        { cat: 'Chăm sóc cá nhân', name: 'Dầu xả TRESemmé Salon', brand: 'TRESemmé', importPrice: 70000, salePrice: 125000, unit: 'Chai', weight: 620, origin: 'Việt Nam', warranty: '24 tháng', attributes: { volume: '620ml' } },

        // Đồng hồ & Trang sức (4 SP)
        { cat: 'Đồng hồ & Trang sức', name: 'Apple Watch Series 9 45mm', brand: 'Apple', importPrice: 8000000, salePrice: 10990000, unit: 'Chiếc', weight: 38, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { screenSize: '45mm', gps: 'Có', battery: '18 giờ' } },
        { cat: 'Đồng hồ & Trang sức', name: 'Đồng hồ Casio G-Shock GA-2100', brand: 'Casio', importPrice: 2000000, salePrice: 3190000, unit: 'Chiếc', weight: 51, origin: 'Thái Lan', warranty: '24 tháng', attributes: { type: 'Analog-Digital', waterResist: '200m', gender: 'Nam' } },
        { cat: 'Đồng hồ & Trang sức', name: 'Đồng hồ Daniel Wellington Classic 36mm', brand: 'Daniel Wellington', importPrice: 1500000, salePrice: 2490000, unit: 'Chiếc', weight: 36, origin: 'Trung Quốc', warranty: '24 tháng', attributes: { type: 'Analog', waterResist: '30m', gender: 'Nữ' } },
        { cat: 'Đồng hồ & Trang sức', name: 'Vòng tay bạc 925 nữ', brand: 'PNJ', importPrice: 300000, salePrice: 550000, unit: 'Chiếc', weight: 8, origin: 'Việt Nam', warranty: '6 tháng', attributes: { material: 'Bạc 925', gender: 'Nữ' } },

        // Túi xách & Balo (6 SP)
        { cat: 'Túi xách & Balo', name: 'Balo laptop The North Face', brand: 'The North Face', importPrice: 1200000, salePrice: 1890000, unit: 'Chiếc', weight: 800, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { capacity: '28L', laptopFit: '15.6 inch', material: 'Nylon chống nước' } },
        { cat: 'Túi xách & Balo', name: 'Túi xách nữ Charles & Keith', brand: 'Charles & Keith', importPrice: 800000, salePrice: 1290000, unit: 'Chiếc', weight: 350, origin: 'Trung Quốc', warranty: '6 tháng', attributes: { material: 'Da PU', gender: 'Nữ', type: 'Túi đeo vai' } },
        { cat: 'Túi xách & Balo', name: 'Balo Adidas Classic', brand: 'Adidas', importPrice: 500000, salePrice: 790000, unit: 'Chiếc', weight: 400, origin: 'Trung Quốc', warranty: '6 tháng', attributes: { capacity: '22L', material: 'Polyester' } },
        { cat: 'Túi xách & Balo', name: 'Ví da nam Pedro', brand: 'Pedro', importPrice: 600000, salePrice: 990000, unit: 'Chiếc', weight: 80, origin: 'Trung Quốc', warranty: '6 tháng', attributes: { material: 'Da bò thật', gender: 'Nam', type: 'Ví ngang' } },
        { cat: 'Túi xách & Balo', name: 'Túi tote vải canvas', brand: 'MUJI', importPrice: 200000, salePrice: 390000, unit: 'Chiếc', weight: 250, origin: 'Trung Quốc', warranty: '', attributes: { material: 'Canvas', gender: 'Unisex' } },
        { cat: 'Túi xách & Balo', name: 'Cặp da công sở nam', brand: 'Pierre Cardin', importPrice: 1000000, salePrice: 1690000, unit: 'Chiếc', weight: 700, origin: 'Việt Nam', warranty: '12 tháng', attributes: { material: 'Da PU cao cấp', laptopFit: '14 inch', gender: 'Nam' } },

        // Thực phẩm (6 SP)
        { cat: 'Thực phẩm & Đồ uống', name: 'Sữa tươi Vinamilk 100% 1L', brand: 'Vinamilk', importPrice: 25000, salePrice: 36000, unit: 'Hộp', weight: 1050, origin: 'Việt Nam', warranty: '6 tháng', attributes: { volume: '1L', type: 'Sữa tươi tiệt trùng' } },
        { cat: 'Thực phẩm & Đồ uống', name: 'Cà phê G7 hòa tan 3in1 hộp 20 gói', brand: 'Trung Nguyên', importPrice: 35000, salePrice: 55000, unit: 'Hộp', weight: 320, origin: 'Việt Nam', warranty: '24 tháng', attributes: { quantity: '20 gói', type: '3in1' } },
        { cat: 'Thực phẩm & Đồ uống', name: 'Nước suối Aquafina 500ml thùng 24 chai', brand: 'PepsiCo', importPrice: 50000, salePrice: 79000, unit: 'Thùng', weight: 12500, origin: 'Việt Nam', warranty: '12 tháng', attributes: { volume: '500ml x 24', type: 'Nước tinh khiết' } },
        { cat: 'Thực phẩm & Đồ uống', name: 'Trà sữa Nestea 255ml lốc 6 lon', brand: 'Nestlé', importPrice: 30000, salePrice: 48000, unit: 'Lốc', weight: 1600, origin: 'Việt Nam', warranty: '12 tháng', attributes: { volume: '255ml x 6' } },
        { cat: 'Thực phẩm & Đồ uống', name: 'Bánh Oreo kem Socola 133g', brand: 'Mondelez', importPrice: 18000, salePrice: 29000, unit: 'Gói', weight: 133, origin: 'Trung Quốc', warranty: '12 tháng', attributes: { weight_product: '133g', type: 'Bánh quy' } },
        { cat: 'Thực phẩm & Đồ uống', name: 'Sữa đặc Ông Thọ 380g', brand: 'Vinamilk', importPrice: 16000, salePrice: 24000, unit: 'Hộp', weight: 380, origin: 'Việt Nam', warranty: '18 tháng', attributes: { weight_product: '380g', type: 'Sữa đặc có đường' } },
    ];

    // Map template sang product data
    productTemplates.forEach((t) => {
        const categoryId = catMap[t.cat];
        if (!categoryId) return;

        products.push({
            name: t.name,
            category: categoryId,
            supplier: pick(supIds),
            brand: t.brand || '',
            importPrice: t.importPrice,
            salePrice: t.salePrice,
            quantity: rand(5, 200),
            minStock: rand(5, 20),
            unit: t.unit || 'Chiếc',
            weight: t.weight || 0,
            origin: t.origin || '',
            warranty: t.warranty || '',
            attributes: t.attributes || {},
            tags: t.tags || [],
            status: 'active',
        });
    });

    return products;
};

// ===== CHẠY SEED =====
async function seed() {
    try {
        await mongoose.connect(process.env.CONNECT_DB);
        console.log('✅ Kết nối MongoDB thành công');

        // Xóa dữ liệu cũ
        await Promise.all([
            modelCategory.deleteMany({}),
            modelSupplier.deleteMany({}),
            modelProduct.deleteMany({}),
        ]);
        console.log('🗑️  Đã xóa dữ liệu cũ');

        // Tạo danh mục
        const categories = await modelCategory.insertMany(categoriesData);
        console.log(`📁 Đã tạo ${categories.length} danh mục`);

        // Tạo NCC (tuần tự để auto-gen code không trùng)
        const suppliers = [];
        for (const supData of suppliersData) {
            const sup = await modelSupplier.create(supData);
            suppliers.push(sup);
        }
        console.log(`🏢 Đã tạo ${suppliers.length} nhà cung cấp`);

        // Tạo sản phẩm (tuần tự để auto-gen SKU không trùng)
        const productsData = generateProducts(categories, suppliers);
        let createdCount = 0;
        for (const pData of productsData) {
            await modelProduct.create(pData);
            createdCount++;
            if (createdCount % 20 === 0) console.log(`  ... đã tạo ${createdCount}/${productsData.length} sản phẩm`);
        }
        console.log(`📦 Đã tạo ${createdCount} sản phẩm`);

        console.log('\n🎉 SEED HOÀN TẤT!');
        console.log(`   - Danh mục: ${categories.length}`);
        console.log(`   - Nhà cung cấp: ${suppliers.length}`);
        console.log(`   - Sản phẩm: ${createdCount}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi seed:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seed();
