
import { sequelize } from "../config/db.js";
import Media from "../models/Media.js";

/**
 * Upsert della “scheda” Media a partire da un DTO normalizzato.
 * Restituisce l'istanza Sequelize aggiornata (Media).
 *
 * DTO atteso:
 * {
 *   id, mediaType, title, overview, year, runtime,
 *   genres[], rating:{vote_average, vote_count},
 *   trailer, poster, backdrop, images[], cast[], externalIds{}
 * }
 */
export async function upsertMediaFromDto(dto) {
  if (!dto?.id || !dto?.mediaType) {
    throw new Error("DTO non valido: id/mediaType mancanti");
  }

  // garantisce che il modello sia registrato (utile se l'import dell'app non è centralizzato)
  if (!sequelize.models.Media) {
    sequelize.models.Media = Media;
  }

  const where = { tmdbId: dto.id, mediaType: dto.mediaType };

  const payload = {
    title: dto.title,
    overview: dto.overview || null,
    year: dto.year || null,
    runtime: dto.runtime || null,
    genres: dto.genres || [],
    voteAverage:
      dto.rating?.vote_average ?? dto.voteAverage ?? null,
    voteCount:
      dto.rating?.vote_count ?? dto.voteCount ?? null,
    trailerUrl: dto.trailer || null,
    posterUrl: dto.poster || null,
    backdropUrl: dto.backdrop || null,
    gallery: dto.images || [],
    cast: (dto.cast || []).map((c) => ({
      personId: c.id ?? c.personId,
      name: c.name,
      character: c.character,
      profileUrl: c.profile,
    })),
    externalIds: dto.externalIds || {},
    lastSyncedAt: new Date(),
  };

  const [media, created] = await Media.findOrCreate({
    where,
    defaults: { ...payload, tmdbId: dto.id, mediaType: dto.mediaType },
  });

  if (!created) await media.update(payload);
  return media.reload();
}
