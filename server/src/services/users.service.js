const modelUser = require('../models/users.model');
const modelApiKey = require('../models/apiKey.model');
const modelMessageChatbot = require('../models/messageChatbot.model');
const { GoogleGenAI } = require('@google/genai');
const modelOtp = require('../models/otp.model');

const { createToken, createRefreshToken, createApiKey, verifyToken } = require('../utils/jwt');
const { jwtDecode } = require('jwt-decode');
const jwt = require('jsonwebtoken');

const { ConflictRequestError, BadRequestError } = require('../core/error.response');

const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const SendMailForgotPassword = require('../utils/sendMailForgotPassword');

class UserService {
    async createUser(data) {
        const { fullName, email, password } = data;
        const findUser = await modelUser.findOne({ email });
        if (findUser) {
            throw new ConflictRequestError('Email đã tồn tại');
        }

        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(password, salt);

        // Tạo user mới
        const newUser = await modelUser.create({
            fullName,
            email,
            password: passwordHash,
            typeLogin: 'email',
        });

        // Tạo API key và token
        await createApiKey(newUser._id);
        const token = await createToken({ id: newUser._id });
        const refreshToken = await createRefreshToken({ id: newUser._id });

        return { token, refreshToken };
    }

    async authUser(id) {
        const findUser = await modelUser.findById(id);
        if (!findUser) {
            throw new BadRequestError('User không tồn tại');
        }
        const userString = JSON.stringify(findUser);
        const auth = CryptoJS.AES.encrypt(userString, process.env.SECRET_CRYPTO).toString();
        return auth;
    }

    async login(data) {
        const { email, password } = data;
        const user = await modelUser.findOne({ email });
        if (!user) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        if (user.typeLogin === 'google') {
            throw new BadRequestError('Tài khoản đăng nhập bằng google');
        }

        const checkPassword = bcrypt.compareSync(password, user.password);
        if (!checkPassword) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        await createApiKey(user._id);
        const token = await createToken({ id: user._id });
        const refreshToken = await createRefreshToken({ id: user._id });
        return { token, refreshToken };
    }

    async logout(id) {
        await modelApiKey.deleteMany({ userId: id });
        return { status: 200 };
    }

    async refreshToken(refreshToken) {
        const decoded = await verifyToken(refreshToken);

        const user = await modelUser.findOne({ _id: decoded.id });

        const token = await createToken({ id: user._id });
        return { token };
    }

    async getAllUser() {
        const data = await modelUser.find();
        return data;
    }

    async updateUserAdmin(id, data) {
        const { fullName, email, phone, address, role, typeLogin } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        user.fullName = fullName;
        user.email = email;
        user.phone = phone;
        user.address = address;
        if (role) {
            user.role = role;
        }
        user.typeLogin = typeLogin;
        await user.save();
        return user;
    }

    async deleteUser(id) {
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        await user.deleteOne();
        return user;
    }

    async changePassword(id, data) {
        const { currentPassword, newPassword } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }
        const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestError('Mật khẩu hiện tại không chính xác');
        }
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(newPassword, salt);
        user.password = passwordHash;
        await user.save();
        return user;
    }

    async updateUser(id, data) {
        const { fullName, address, phone, birthDay, email, avatar } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }
        if (fullName !== undefined) user.fullName = fullName;
        if (address !== undefined) user.address = address;
        if (phone !== undefined) user.phone = phone;
        if (birthDay !== undefined) user.birthDay = birthDay;
        if (email !== undefined) user.email = email;
        if (avatar !== undefined) user.avatar = avatar;
        await user.save();
        return user;
    }

    async uploadAvatar(id, filename) {
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }
        user.avatar = filename;
        await user.save();
        return user;
    }

    async loginGoogle(credential) {
        const dataToken = jwtDecode(credential);
        const user = await modelUser.findOne({ email: dataToken.email });

        if (user) {
            await createApiKey(user._id);
            const token = await createToken({ id: user._id });
            const refreshToken = await createRefreshToken({ id: user._id });
            return { token, refreshToken };
        } else {
            const newUser = await modelUser.create({
                email: dataToken.email,
                typeLogin: 'google',
                fullName: dataToken.name,
            });
            await createApiKey(newUser._id);
            const token = await createToken({ id: newUser._id });
            const refreshToken = await createRefreshToken({ id: newUser._id });
            return { token, refreshToken };
        }
    }

    async forgotPassword(email) {
        const user = await modelUser.findOne({ email });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }

        const token = jwt.sign({ id: user._id }, process.env.SECRET_CRYPTO, { expiresIn: '5m' });

        const otp = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const saltRounds = 10;

        const otpHash = bcrypt.hashSync(otp, saltRounds);

        await modelOtp.create({ email: user.email, otp: otpHash });

        await SendMailForgotPassword(user.email, otp);

        return { token, otp };
    }

    async resetPassword(token, otpUser, newPassword) {
        const decoded = jwt.verify(token, process.env.SECRET_CRYPTO);
        const user = await modelUser.findOne({ _id: decoded.id });

        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        const findOtp = await modelOtp.findOne({ email: user.email }).sort({ createdAt: -1 });

        if (!findOtp) {
            throw new BadRequestError('Mã OTP không hợp lệ');
        }

        const checkOtp = bcrypt.compareSync(otpUser, findOtp.otp);
        if (!checkOtp) {
            throw new BadRequestError('Mã OTP không hợp lệ');
        }
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(newPassword, salt);
        user.password = passwordHash;
        await user.save();
        return user;
    }

    async chatbot(contents, userId) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // =====================================================================
        // SYSTEM INSTRUCTION – Định nghĩa vai trò & cách dùng tool
        // =====================================================================
        const systemInstruction = `Bạn là trợ lý AI thông minh cho hệ thống Quản lý kho. 
Bạn có thể truy vấn dữ liệu thực từ cơ sở dữ liệu thông qua các công cụ (tools) được cung cấp.
Khi người dùng hỏi về tồn kho, phiếu nhập, phiếu xuất, sản phẩm, nhà cung cấp, hãy LUÔN sử dụng tool phù hợp để lấy dữ liệu thực thay vì tự đoán.
Trả lời bằng tiếng Việt, rõ ràng, chuyên nghiệp. Khi có danh sách, format dưới dạng markdown bảng hoặc danh sách có thứ tự.
Không bịa số liệu. Nếu không tìm thấy dữ liệu, hãy nói rõ.`;

        // =====================================================================
        // TOOL DEFINITIONS – Khai báo các hàm DB cho Gemini
        // =====================================================================
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: 'get_product_stock',
                        description: 'Lấy thông tin tồn kho của sản phẩm theo tên hoặc SKU',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                name: { type: 'STRING', description: 'Tên sản phẩm cần tìm (tìm kiếm gần đúng)' },
                                sku: { type: 'STRING', description: 'Mã SKU của sản phẩm' },
                            },
                        },
                    },
                    {
                        name: 'get_low_stock_products',
                        description: 'Lấy danh sách sản phẩm sắp hết hàng (tồn kho ≤ mức tồn tối thiểu)',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                limit: { type: 'NUMBER', description: 'Số lượng sản phẩm tối đa trả về, mặc định 10' },
                            },
                        },
                    },
                    {
                        name: 'get_out_of_stock_products',
                        description: 'Lấy danh sách sản phẩm hết hàng (tồn kho = 0)',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                limit: { type: 'NUMBER', description: 'Số lượng sản phẩm tối đa trả về, mặc định 10' },
                            },
                        },
                    },
                    {
                        name: 'get_import_orders',
                        description: 'Lấy danh sách phiếu nhập kho theo khoảng thời gian',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                period: {
                                    type: 'STRING',
                                    description:
                                        'Khoảng thời gian: "today" (hôm nay), "week" (tuần này), "month" (tháng này), "all" (tất cả)',
                                    enum: ['today', 'week', 'month', 'all'],
                                },
                                status: {
                                    type: 'STRING',
                                    description: 'Trạng thái phiếu: pending, completed, cancelled, draft',
                                },
                                limit: { type: 'NUMBER', description: 'Số lượng phiếu tối đa trả về, mặc định 10' },
                            },
                        },
                    },
                    {
                        name: 'get_export_orders',
                        description: 'Lấy danh sách phiếu xuất kho theo khoảng thời gian',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                period: {
                                    type: 'STRING',
                                    description:
                                        'Khoảng thời gian: "today" (hôm nay), "week" (tuần này), "month" (tháng này), "all" (tất cả)',
                                    enum: ['today', 'week', 'month', 'all'],
                                },
                                status: {
                                    type: 'STRING',
                                    description: 'Trạng thái phiếu: pending, completed, cancelled, draft',
                                },
                                limit: { type: 'NUMBER', description: 'Số lượng phiếu tối đa trả về, mặc định 10' },
                            },
                        },
                    },
                    {
                        name: 'get_inventory_summary',
                        description: 'Lấy tổng quan kho hàng: tổng số sản phẩm, tổng giá trị kho, số hàng sắp hết',
                        parameters: {
                            type: 'OBJECT',
                            properties: {},
                        },
                    },
                    {
                        name: 'search_products',
                        description: 'Tìm kiếm sản phẩm theo tên, danh mục, thương hiệu',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                keyword: { type: 'STRING', description: 'Từ khóa tìm kiếm' },
                                category: { type: 'STRING', description: 'Tên danh mục sản phẩm' },
                                brand: { type: 'STRING', description: 'Thương hiệu sản phẩm' },
                                limit: { type: 'NUMBER', description: 'Số lượng kết quả tối đa, mặc định 10' },
                            },
                        },
                    },
                    {
                        name: 'get_top_products',
                        description: 'Lấy top sản phẩm theo tiêu chí (tồn kho nhiều nhất, đã bán nhiều nhất)',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                sortBy: {
                                    type: 'STRING',
                                    description:
                                        'Sắp xếp theo: "quantity" (tồn kho), "soldCount" (đã bán), "importPrice" (giá nhập), "salePrice" (giá bán)',
                                    enum: ['quantity', 'soldCount', 'importPrice', 'salePrice'],
                                },
                                limit: { type: 'NUMBER', description: 'Số lượng sản phẩm top, mặc định 5' },
                            },
                        },
                    },
                    {
                        name: 'get_supplier_info',
                        description: 'Lấy thông tin nhà cung cấp',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                name: { type: 'STRING', description: 'Tên nhà cung cấp cần tìm (tìm gần đúng)' },
                                status: {
                                    type: 'STRING',
                                    description: 'Trạng thái: "active" (đang hoạt động), "inactive" (ngừng)',
                                    enum: ['active', 'inactive'],
                                },
                            },
                        },
                    },
                ],
            },
        ];

        // =====================================================================
        // FUNCTION EXECUTOR – Thực thi query MongoDB theo tool AI chọn
        // =====================================================================
        const executeTool = async (toolName, args) => {
            const modelProduct = require('../models/product.model');
            const modelImport = require('../models/import.model');
            const modelExport = require('../models/export.model');
            const modelSupplier = require('../models/supplier.model');
            const modelCategory = require('../models/category.model');

            const getDateRange = (period) => {
                const now = new Date();
                let start;
                if (period === 'today') {
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                } else if (period === 'week') {
                    start = new Date(now);
                    start.setDate(now.getDate() - 7);
                } else if (period === 'month') {
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                } else {
                    return null; // all
                }
                return start;
            };

            switch (toolName) {
                case 'get_product_stock': {
                    const query = { status: { $ne: 'inactive' } };
                    if (args.sku) query.sku = { $regex: args.sku, $options: 'i' };
                    if (args.name) query.name = { $regex: args.name, $options: 'i' };
                    const products = await modelProduct
                        .find(query)
                        .select('name sku quantity minStock unit status salePrice importPrice')
                        .populate('category', 'name')
                        .limit(10)
                        .lean();
                    return products.map((p) => ({
                        name: p.name,
                        sku: p.sku,
                        quantity: p.quantity,
                        minStock: p.minStock,
                        unit: p.unit,
                        status: p.status,
                        category: p.category?.name || '',
                        isLowStock: p.quantity <= p.minStock && p.quantity > 0,
                        salePrice: p.salePrice,
                    }));
                }

                case 'get_low_stock_products': {
                    const limit = args.limit || 10;
                    const products = await modelProduct
                        .find({
                            status: { $nin: ['inactive', 'out_of_stock'] },
                            $expr: { $lte: ['$quantity', '$minStock'] },
                            quantity: { $gt: 0 },
                        })
                        .select('name sku quantity minStock unit')
                        .populate('category', 'name')
                        .sort({ quantity: 1 })
                        .limit(limit)
                        .lean();
                    return products.map((p) => ({
                        name: p.name,
                        sku: p.sku,
                        quantity: p.quantity,
                        minStock: p.minStock,
                        unit: p.unit,
                        category: p.category?.name || '',
                    }));
                }

                case 'get_out_of_stock_products': {
                    const limit = args.limit || 10;
                    const products = await modelProduct
                        .find({ status: 'out_of_stock' })
                        .select('name sku quantity unit')
                        .populate('category', 'name')
                        .sort({ updatedAt: -1 })
                        .limit(limit)
                        .lean();
                    return products.map((p) => ({
                        name: p.name,
                        sku: p.sku,
                        quantity: p.quantity,
                        unit: p.unit,
                        category: p.category?.name || '',
                    }));
                }

                case 'get_import_orders': {
                    const limit = args.limit || 10;
                    const query = {};
                    if (args.status) query.status = args.status;
                    const startDate = getDateRange(args.period || 'all');
                    if (startDate) query.createdAt = { $gte: startDate };

                    const orders = await modelImport
                        .find(query)
                        .populate('supplier', 'name code')
                        .select('code status totalAmount totalItems importDate createdAt note')
                        .sort({ createdAt: -1 })
                        .limit(limit)
                        .lean();

                    return orders.map((o) => ({
                        code: o.code,
                        supplier: o.supplier?.name || 'N/A',
                        status: o.status,
                        totalAmount: o.totalAmount,
                        totalItems: o.totalItems,
                        importDate: o.importDate || o.createdAt,
                        note: o.note,
                    }));
                }

                case 'get_export_orders': {
                    const limit = args.limit || 10;
                    const query = {};
                    if (args.status) query.status = args.status;
                    const startDate = getDateRange(args.period || 'all');
                    if (startDate) query.createdAt = { $gte: startDate };

                    const orders = await modelExport
                        .find(query)
                        .select('code type status totalAmount totalItems exportDate receiver createdAt note')
                        .sort({ createdAt: -1 })
                        .limit(limit)
                        .lean();

                    return orders.map((o) => ({
                        code: o.code,
                        type: o.type,
                        receiver: o.receiver || 'N/A',
                        status: o.status,
                        totalAmount: o.totalAmount,
                        totalItems: o.totalItems,
                        exportDate: o.exportDate || o.createdAt,
                        note: o.note,
                    }));
                }

                case 'get_inventory_summary': {
                    const [totalProducts, lowStockCount, outOfStockCount, aggregation] = await Promise.all([
                        modelProduct.countDocuments({ status: { $ne: 'inactive' } }),
                        modelProduct.countDocuments({
                            status: { $nin: ['inactive', 'out_of_stock'] },
                            $expr: { $lte: ['$quantity', '$minStock'] },
                            quantity: { $gt: 0 },
                        }),
                        modelProduct.countDocuments({ status: 'out_of_stock' }),
                        modelProduct.aggregate([
                            { $match: { status: { $ne: 'inactive' } } },
                            {
                                $group: {
                                    _id: null,
                                    totalQuantity: { $sum: '$quantity' },
                                    totalImportValue: { $sum: { $multiply: ['$quantity', '$importPrice'] } },
                                    totalSaleValue: { $sum: { $multiply: ['$quantity', '$salePrice'] } },
                                },
                            },
                        ]),
                    ]);

                    const stats = aggregation[0] || {};
                    return {
                        totalProducts,
                        lowStockCount,
                        outOfStockCount,
                        totalQuantity: stats.totalQuantity || 0,
                        totalImportValue: stats.totalImportValue || 0,
                        totalSaleValue: stats.totalSaleValue || 0,
                        estimatedProfit: (stats.totalSaleValue || 0) - (stats.totalImportValue || 0),
                    };
                }

                case 'search_products': {
                    const limit = args.limit || 10;
                    const query = { status: { $ne: 'inactive' } };
                    if (args.keyword) query.name = { $regex: args.keyword, $options: 'i' };
                    if (args.brand) query.brand = { $regex: args.brand, $options: 'i' };

                    if (args.category) {
                        const cat = await modelCategory.findOne({
                            name: { $regex: args.category, $options: 'i' },
                        });
                        if (cat) query.category = cat._id;
                    }

                    const products = await modelProduct
                        .find(query)
                        .select('name sku quantity minStock unit salePrice importPrice brand status')
                        .populate('category', 'name')
                        .populate('supplier', 'name')
                        .sort({ quantity: -1 })
                        .limit(limit)
                        .lean();

                    return products.map((p) => ({
                        name: p.name,
                        sku: p.sku,
                        brand: p.brand,
                        quantity: p.quantity,
                        unit: p.unit,
                        salePrice: p.salePrice,
                        importPrice: p.importPrice,
                        category: p.category?.name || '',
                        supplier: p.supplier?.name || '',
                        status: p.status,
                    }));
                }

                case 'get_top_products': {
                    const limit = args.limit || 5;
                    const sortBy = args.sortBy || 'quantity';
                    const sortObj = { [sortBy]: -1 };

                    const products = await modelProduct
                        .find({ status: { $ne: 'inactive' } })
                        .select('name sku quantity soldCount salePrice importPrice unit')
                        .populate('category', 'name')
                        .sort(sortObj)
                        .limit(limit)
                        .lean();

                    return products.map((p) => ({
                        name: p.name,
                        sku: p.sku,
                        quantity: p.quantity,
                        soldCount: p.soldCount,
                        salePrice: p.salePrice,
                        unit: p.unit,
                        category: p.category?.name || '',
                    }));
                }

                case 'get_supplier_info': {
                    const query = {};
                    if (args.name) query.name = { $regex: args.name, $options: 'i' };
                    if (args.status) query.status = args.status;

                    const suppliers = await modelSupplier
                        .find(query)
                        .select('name code contactPerson phone email address status')
                        .lean();

                    return suppliers.map((s) => ({
                        name: s.name,
                        code: s.code,
                        contactPerson: s.contactPerson,
                        phone: s.phone,
                        email: s.email,
                        address: s.address,
                        status: s.status,
                    }));
                }

                default:
                    return { error: `Tool "${toolName}" không tồn tại` };
            }
        };

        // =====================================================================
        // MULTI-TURN FUNCTION CALLING LOOP
        // =====================================================================
        let currentContents = [...contents];
        let finalText = '';
        const MAX_TURNS = 5;

        for (let turn = 0; turn < MAX_TURNS; turn++) {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: currentContents,
                config: {
                    systemInstruction,
                    tools,
                },
            });

            // Kiểm tra có function call không
            const candidate = response.candidates?.[0];
            const parts = candidate?.content?.parts || [];
            const functionCalls = parts.filter((p) => p.functionCall);

            if (functionCalls.length === 0) {
                // Không có function call → lấy text trả về
                finalText = response.text || parts.find((p) => p.text)?.text || 'Không có phản hồi.';
                break;
            }

            // Thực thi tất cả function calls
            const functionResults = [];
            for (const part of functionCalls) {
                const { name, args } = part.functionCall;
                let result;
                try {
                    result = await executeTool(name, args || {});
                } catch (err) {
                    result = { error: err.message };
                }
                functionResults.push({
                    functionResponse: {
                        name,
                        response: { result },
                    },
                });
            }

            // Thêm model turn + function results vào conversation
            currentContents = [...currentContents, { role: 'model', parts }, { role: 'user', parts: functionResults }];
        }

        // Lưu lịch sử vào DB
        const lastUserMsg = contents.filter((c) => c.role === 'user').pop();
        const question = lastUserMsg?.parts?.[0]?.text || '';

        await modelMessageChatbot.create({ userId, sender: 'user', content: question });
        await modelMessageChatbot.create({ userId, sender: 'bot', content: finalText });

        return finalText;
    }

    async getMessageChatbot(userId) {
        const messageChatbot = await modelMessageChatbot.find({ userId }).sort({ createdAt: 1 });
        return messageChatbot;
    }
}

module.exports = new UserService();
