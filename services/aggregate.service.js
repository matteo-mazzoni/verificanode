
import { sequelize } from "../config/db.js";
import { Op } from "sequelize";
const { UserMedia, Comment, Media } = sequelize.models;

/**
 * Ricalcola e aggiorna su Media:
 * - avgPersonalRating (media voti utenti da UserMedia.personalRating)
 * - ratingsCount       (conteggio voti non null)
 * - commentsCount      (conteggio commenti)
 *
 * Aggiungi le colonne su Media se vuoi memorizzarle in tabella (consigliato).
 */
export async function recomputeMediaAggregates(mediaId) {
  // 1) rating medio e count da UserMedia
  const ratings = await UserMedia.findAll({
     where: { mediaId, personalRating: { [Op.not]: null } },
    attributes: ["personalRating"],
    raw: true,
  });

  const ratingsCount = ratings.length;
  const avgPersonalRating =
    ratingsCount > 0
      ? ratings.reduce((s, r) => s + (r.personalRating ?? 0), 0) / ratingsCount
      : null;

  // 2) numero commenti
  const commentsCount = await Comment.count({ where: { mediaId } });

   // 3) aggiorna Media (se le colonne non esistono ancora, non fallire l'intera richiesta)
  try {
    await Media.update(
      { avgPersonalRating, ratingsCount, commentsCount },
      { where: { id: mediaId } }
    );
  } catch (e) {
    console.warn(
      "[aggregate] colonne aggregate mancanti su Media. Aggiungile in models/Media.js:",
      "avgPersonalRating (FLOAT), ratingsCount (INT), commentsCount (INT)"
    );
  }

  return { avgPersonalRating, ratingsCount, commentsCount };
}