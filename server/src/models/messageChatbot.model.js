const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageChatbotSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true,
            index: true,
        },
        sender: {
            type: String,
            enum: ['user', 'bot'],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('messageChatbot', messageChatbotSchema);
