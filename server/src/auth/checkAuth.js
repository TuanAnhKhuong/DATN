const { AuthFailureError, ForbiddenError } = require('../core/error.response');
const { verifyToken } = require('../utils/jwt');
const modelUser = require('../models/users.model');

const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) throw new AuthFailureError('Vui lòng đăng nhập');
        const decoded = await verifyToken(token);

        // Kiểm tra tài khoản bị khóa
        const user = await modelUser.findById(decoded.id);
        if (!user) throw new AuthFailureError('Tài khoản không tồn tại');
        if (user.isLocked) throw new ForbiddenError('Tài khoản đã bị khóa');

        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware kiểm tra quyền theo role
const authorize = (...roles) => {
    return async (req, res, next) => {
        try {
            const user = await modelUser.findById(req.user.id);
            if (!user) throw new AuthFailureError('Tài khoản không tồn tại');
            if (!roles.includes(user.role)) {
                throw new ForbiddenError('Bạn không có quyền thực hiện chức năng này');
            }
            req.userRole = user.role;
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    asyncHandler,
    authUser,
    authorize,
};
