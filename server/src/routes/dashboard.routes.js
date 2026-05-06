const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboard.controller');
const { asyncHandler, authUser } = require('../auth/checkAuth');

router.get('/stats', authUser, asyncHandler(dashboardController.getStats));

module.exports = router;
