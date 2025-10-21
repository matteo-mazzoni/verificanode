// models/UserMedia.js
const mongoose = require('mongoose');

const UserMediaSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', index: true, required: true },

  // stato nelle liste personali (ponte con punto C)
  status: { 
    type: String, 
    default: 'to_watch', 
    index: true 
  },

  // dati personali dell'utente su quel titolo
  personalComment: { type: String },

});

// Evita duplicati per (user, media)
UserMediaSchema.index({ user: 1, media: 1 }, { unique: true });


module.exports = mongoose.model('UserMedia', UserMediaSchema);
