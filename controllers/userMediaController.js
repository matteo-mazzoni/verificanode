
import { sequelize } from "../config/db.js";

const { User, Media, UserMedia } = sequelize.models;

/** utility per ottenere userId (auth o fallback query) */
function getUserId(req) {
  return req.user?.id || Number(req.query.userId); // dev only
}

/** GET /api/user-media  → lista della libreria utente (con Media incluso) */
export async function listUserMedia(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "userId non disponibile" });

    const items = await UserMedia.findAll({
      where: { userId },
      include: [
        {
          model: Media,
          as: "Media",
          attributes: [
            "id", "tmdbId", "mediaType", "title", "posterUrl",
            "voteAverage", "year", "backdropUrl"
          ]
        }
      ],
      order: [["updatedAt", "DESC"]],
    });

    res.json(items);
  } catch (err) {
    console.error("listUserMedia error:", err);
    res.status(500).json({ error: "Errore nel recupero della libreria" });
  }
}

/**
 * POST /api/user-media/:mediaId
 * body: { status?, personalRating?, personalComment?, watchedAt? }
 * se non esiste crea, altrimenti aggiorna (upsert)
 */
export async function upsertUserMedia(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "userId non disponibile" });

    const mediaId = Number(req.params.mediaId);
    if (!mediaId) return res.status(400).json({ error: "mediaId non valido" });

    const { status, personalRating, personalComment, watchedAt } = req.body || {};

    const [row, created] = await UserMedia.findOrCreate({
      where: { userId, mediaId },
      defaults: { status: status || "to_watch", personalRating, personalComment, watchedAt }
    });

    if (!created) {
      await row.update({
        ...(status ? { status } : {}),
        ...(personalRating !== undefined ? { personalRating } : {}),
        ...(personalComment !== undefined ? { personalComment } : {}),
        ...(watchedAt ? { watchedAt } : {})
      });
    }

    // includi info Media per comodità
    const withMedia = await UserMedia.findByPk(row.id, {
      include: [{ model: Media, as: "Media" }]
    });

    res.status(created ? 201 : 200).json(withMedia);
  } catch (err) {
    console.error("upsertUserMedia error:", err);
    res.status(500).json({ error: "Errore nel salvataggio in libreria" });
  }
}

/** PATCH /api/user-media/:mediaId/status  body: { status } */
export async function updateStatus(req, res) {
  try {
    const userId = getUserId(req);
    const mediaId = Number(req.params.mediaId);
    const { status } = req.body || {};
    if (!userId) return res.status(401).json({ error: "userId non disponibile" });
    if (!mediaId) return res.status(400).json({ error: "mediaId non valido" });
    if (!["to_watch", "watching", "watched", "favorite"].includes(status)) {
      return res.status(400).json({ error: "status non valido" });
    }

    const row = await UserMedia.findOne({ where: { userId, mediaId } });
    if (!row) return res.status(404).json({ error: "Elemento non trovato in libreria" });

    await row.update({ status });
    res.json(row);
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ error: "Errore aggiornamento status" });
  }
}

/** PATCH /api/user-media/:mediaId/rating  body: { personalRating, personalComment? } */
export async function updateRating(req, res) {
  try {
    const userId = getUserId(req);
    const mediaId = Number(req.params.mediaId);
    const { personalRating, personalComment } = req.body || {};
    if (!userId) return res.status(401).json({ error: "userId non disponibile" });
    if (!mediaId) return res.status(400).json({ error: "mediaId non valido" });
    if (personalRating == null || personalRating < 0 || personalRating > 10) {
      return res.status(400).json({ error: "personalRating deve essere tra 0 e 10" });
    }

    const row = await UserMedia.findOne({ where: { userId, mediaId } });
    if (!row) return res.status(404).json({ error: "Elemento non trovato in libreria" });

    await row.update({
      personalRating,
      ...(personalComment !== undefined ? { personalComment } : {})
    });

    res.json(row);
  } catch (err) {
    console.error("updateRating error:", err);
    res.status(500).json({ error: "Errore aggiornamento rating" });
  }
}

/** DELETE /api/user-media/:mediaId  → rimuove il titolo dalla libreria */
export async function removeFromLibrary(req, res) {
  try {
    const userId = getUserId(req);
    const mediaId = Number(req.params.mediaId);
    if (!userId) return res.status(401).json({ error: "userId non disponibile" });
    if (!mediaId) return res.status(400).json({ error: "mediaId non valido" });

    const deleted = await UserMedia.destroy({ where: { userId, mediaId } });
    if (!deleted) return res.status(404).json({ error: "Elemento non presente" });
    res.status(204).send();
  } catch (err) {
    console.error("removeFromLibrary error:", err);
    res.status(500).json({ error: "Errore rimozione dalla libreria" });
  }
}
