const express = require('express');
const router = express.Router();
const chatbotController = require('../controller/chatbot.controller');
const { asyncHandler, authUser } = require('../auth/checkAuth');

router.post('/', authUser, asyncHandler(chatbotController.chat));
router.get('/history', authUser, asyncHandler(chatbotController.getHistory));

module.exports = router;
