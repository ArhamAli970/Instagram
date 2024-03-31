const mongoose = require('mongoose');

// Define the message schema
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account', // Reference to the User model
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account', // Reference to the User model
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create the Message model
const Chat= mongoose.model('Chat', messageSchema);

module.exports = Chat;
