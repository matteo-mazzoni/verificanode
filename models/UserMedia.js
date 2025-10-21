// models/UserMedia.js
const mongoose = require('mongoose');

const UserMediaSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', index: true, required: true },

  // stato nelle liste personali (ponte con punto C)
  status: { 
    type: String, 
    enum: ['to_watch','watching','watched','favorite'], 
    default: 'to_watch', 
    index: true 
  },

  // dati personali dell'utente su quel titolo
  personalRating: { type: Number, min: 0, max: 10 },
  personalComment: { type: String },

  // opzionale: quando l'utente l'ha visto
  watchedAt: { type: Date }
}, { timestamps: true });

// Evita duplicati per (user, media)
UserMediaSchema.index({ user: 1, media: 1 }, { unique: true });

module.exports = mongoose.model('UserMedia', UserMediaSchema);
