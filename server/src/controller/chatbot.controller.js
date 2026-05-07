const UserService = require('../services/users.service');
const { OK } = require('../core/success.response');

const chatbotController = {
    chat: async (req, res) => {
        const { id } = req.user;
        const { contents } = req.body;

        if (!contents || !Array.isArray(contents) || contents.length === 0) {
            return res.status(400).json({ success: false, message: 'Cần gửi mảng contents hội thoại' });
        }

        const responseText = await UserService.chatbot(contents, id);

        return new OK({ message: 'success', metadata: { role: 'model', text: responseText } }).send(res);
    },

    getHistory: async (req, res) => {
        const { id } = req.user;
        const messages = await UserService.getMessageChatbot(id);
        return new OK({ message: 'success', metadata: messages }).send(res);
    },
};

module.exports = chatbotController;
