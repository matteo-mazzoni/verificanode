
import { sequelize } from "../config/db.js";
import { recomputeMediaAggregates } from "../services/aggregate.service.js";

const { User, Media, UserMedia, Comment } = sequelize.models;

function getUserId(req) {
  return req.user?.id || Number(req.query.userId); // dev fallback
}

/** ====== LIBRERIA (UserMedia) ====== */

export async function listUserMedia(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "userId non disponibile" });

    const items = await UserMedia.findAll({
      where: { userId },
      include: [
        { model: Media, as: "Media",
          attributes: [
            "id","tmdbId","mediaType","title","posterUrl","backdropUrl",
            "voteAverage","year","avgPersonalRating","ratingsCount","commentsCount"
          ]
        }
      ],
      order: [["updatedAt","DESC"]],
    });

    res.json(items);
  } catch (err) {
    console.error("listUserMedia error:", err);
    res.status(500).json({ error: "Errore nel recupero della libreria" });
  }
}

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

    // aggiorna aggregati se è cambiato il rating
    if (personalRating !== undefined) {
      await recomputeMediaAggregates(mediaId);
    }

    const withMedia = await UserMedia.findByPk(row.id, {
      include: [{ model: Media, as: "Media" }]
    });

    res.status(created ? 201 : 200).json(withMedia);
  } catch (err) {
    console.error("upsertUserMedia error:", err);
    res.status(500).json({ error: "Errore nel salvataggio in libreria" });
  }
}

export async function updateStatus(req, res) {
  try {
    const userId = getUserId(req);
    const mediaId = Number(req.params.mediaId);
    const { status } = req.body || {};
    if (!userId) return res.status(401).json({ error: "userId non disponibile" });
    if (!mediaId) return res.status(400).json({ error: "mediaId non valido" });
    if (!["to_watch","watching","watched","favorite"].includes(status)) {
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

    // aggiorna aggregati
    await recomputeMediaAggregates(mediaId);

    res.json(row);
  } catch (err) {
    console.error("updateRating error:", err);
    res.status(500).json({ error: "Errore aggiornamento rating" });
  }
}

export async function removeFromLibrary(req, res) {
  try {
    const userId = getUserId(req);
    const mediaId = Number(req.params.mediaId);
    if (!userId) return res.status(401).json({ error: "userId non disponibile" });
    if (!mediaId) return res.status(400).json({ error: "mediaId non valido" });

    const deleted = await UserMedia.destroy({ where: { userId, mediaId } });
    if (!deleted) return res.status(404).json({ error: "Elemento non presente" });

    // aggiornare aggregati potrebbe non essere necessario qui (rating non esiste più)
    await recomputeMediaAggregates(mediaId);

    res.status(204).send();
  } catch (err) {
    console.error("removeFromLibrary error:", err);
    res.status(500).json({ error: "Errore rimozione dalla libreria" });
  }
}

/** ====== COMMENTI ====== */

/** POST /api/user-media/:mediaId/comments  body: { text, rating? } */
export async function createComment(req, res) {
  try {
    const userId = getUserId(req);
    const mediaId = Number(req.params.mediaId);
    const { text, rating } = req.body || {};

    if (!userId) return res.status(401).json({ error: "userId non disponibile" });
    if (!mediaId) return res.status(400).json({ error: "mediaId non valido" });
    if (!text || !text.trim()) return res.status(400).json({ error: "text obbligatorio" });
    if (rating != null && (rating < 0 || rating > 10)) {
      return res.status(400).json({ error: "rating (commento) deve essere 0..10" });
    }

    const comment = await Comment.create({ userId, mediaId, text: text.trim(), rating: rating ?? null });

    // se rating sul commento vuoi che influisca sulla media utente, copia su UserMedia.personalRating
    if (rating != null) {
      const [row] = await UserMedia.findOrCreate({
        where: { userId, mediaId },
        defaults: { status: "watched", personalRating: rating }
      });
      if (row.personalRating !== rating) await row.update({ personalRating: rating });
      await recomputeMediaAggregates(mediaId);
    } else {
      // comunque aggiorna conteggio commenti
      await recomputeMediaAggregates(mediaId);
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error("createComment error:", err);
    res.status(500).json({ error: "Errore creazione commento" });
  }
}

/** GET /api/user-media/:mediaId/comments?limit=20&offset=0 */
export async function listComments(req, res) {
  try {
    const mediaId = Number(req.params.mediaId);
    if (!mediaId) return res.status(400).json({ error: "mediaId non valido" });

    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const comments = await Comment.findAll({
      where: { mediaId },
      include: [{ model: User, attributes: ["id","name","email"] }],
      order: [["createdAt","DESC"]],
      limit,
      offset
    });

    res.json(comments);
  } catch (err) {
    console.error("listComments error:", err);
    res.status(500).json({ error: "Errore recupero commenti" });
  }
}

/** PATCH /api/user-media/:mediaId/comments/:commentId  body: { text?, rating? } */
export async function updateComment(req, res) {
  try {
    const userId = getUserId(req);
    const mediaId = Number(req.params.mediaId);
    const commentId = Number(req.params.commentId);
    const { text, rating } = req.body || {};

    if (!userId) return res.status(401).json({ error: "userId non disponibile" });
    if (!mediaId || !commentId) return res.status(400).json({ error: "parametri non validi" });
    if (rating != null && (rating < 0 || rating > 10)) {
      return res.status(400).json({ error: "rating deve essere 0..10" });
    }

    const comment = await Comment.findOne({ where: { id: commentId, mediaId, userId } });
    if (!comment) return res.status(404).json({ error: "Commento non trovato" });

    await comment.update({
      ...(text !== undefined ? { text: text.trim() } : {}),
      ...(rating !== undefined ? { rating } : {}),
    });

    // se aggiorni rating sul commento, riflette su UserMedia e aggregati
    if (rating !== undefined) {
      const row = await UserMedia.findOne({ where: { userId, mediaId } });
      if (row) {
        await row.update({ personalRating: rating });
      } else {
        await UserMedia.create({ userId, mediaId, status: "watched", personalRating: rating });
      }
      await recomputeMediaAggregates(mediaId);
    } else {
      await recomputeMediaAggregates(mediaId);
    }

    res.json(comment);
  } catch (err) {
    console.error("updateComment error:", err);
    res.status(500).json({ error: "Errore aggiornamento commento" });
  }
}

/** DELETE /api/user-media/:mediaId/comments/:commentId */
export async function deleteComment(req, res) {
  try {
    const userId = getUserId(req);
    const mediaId = Number(req.params.mediaId);
    const commentId = Number(req.params.commentId);

    if (!userId) return res.status(401).json({ error: "userId non disponibile" });
    if (!mediaId || !commentId) return res.status(400).json({ error: "parametri non validi" });

    const deleted = await Comment.destroy({ where: { id: commentId, mediaId, userId } });
    if (!deleted) return res.status(404).json({ error: "Commento non trovato" });

    await recomputeMediaAggregates(mediaId);
    res.status(204).send();
  } catch (err) {
    console.error("deleteComment error:", err);
    res.status(500).json({ error: "Errore cancellazione commento" });
  }
}
