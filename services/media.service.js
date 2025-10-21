// services/media.service.js
const Media = require('../models/Media');

// dto = oggetto già normalizzato dalla tua chiamata a TMDb
async function upsertMediaFromDto(dto) {
  const update = {
    mediaType: dto.mediaType,
    title: dto.title,
    overview: dto.overview,
    year: dto.year,
    runtime: dto.runtime,
    genres: dto.genres || [],
    voteAverage: dto.rating?.vote_average ?? dto.voteAverage,
    voteCount: dto.rating?.vote_count ?? dto.voteCount,
    trailerUrl: dto.trailer,
    posterUrl: dto.poster,
    backdropUrl: dto.backdrop,
    gallery: dto.images || [],
    cast: (dto.cast || []).map(c => ({
      personId: c.id || c.personId,
      name: c.name,
      character: c.character,
      profileUrl: c.profile
    })),
    externalIds: dto.externalIds || {},
    lastSyncedAt: new Date()
  };

  const doc = await Media.findOneAndUpdate(
    { tmdbId: dto.id, mediaType: dto.mediaType },
    { $set: update, $setOnInsert: { tmdbId: dto.id } },
    { new: true, upsert: true }
  );

  return doc;
}

module.exports = { upsertMediaFromDto };
