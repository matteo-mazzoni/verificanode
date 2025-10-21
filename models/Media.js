
const mongoose = require('mongoose');

const CastSchema = new mongoose.Schema({
  personId: { type: Number, required: true },   // TMDb person id
  name: { type: String, required: true },
  character: { type: String },
  profileUrl: { type: String }                  // immagine profilo già risolta
}, { _id: false });

const MediaSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true, unique: true, index: true },
  mediaType: { type: String, enum: ['movie','tv'], required: true },

  title: { type: String, required: true, index: 'text' },
  overview: { type: String },
  year: { type: Number },
  runtime: { type: Number },                    // min (movie) o durata media ep (tv)
  genres: [{ type: String }],

  voteAverage: { type: Number },                // TMDb vote_average (0–10)
  voteCount: { type: Number },

  trailerUrl: { type: String },                 // es. https://youtube.com/watch?v=...
  posterUrl: { type: String },
  backdropUrl: { type: String },
  gallery: [{ type: String }],                  // fino a ~10 backdrops

  cast: [CastSchema],                            // primi 6–8 membri del cast
  externalIds: {
    imdb_id: { type: String },
    tvdb_id: { type: Number },
    facebook_id: { type: String },
    instagram_id: { type: String },
    twitter_id: { type: String }
  },

  lastSyncedAt: { type: Date, default: Date.now } // per sapere quando rinfrescare
}, { timestamps: true });

module.exports = mongoose.model('Media', MediaSchema);
