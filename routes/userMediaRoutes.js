
import { Router } from "express";
import {
  listUserMedia,
  upsertUserMedia,
  updateStatus,
  updateRating,
  removeFromLibrary,
} from "../controllers/userMediaController.js";

const router = Router();

// elenco libreria dell'utente
router.get("/", listUserMedia);

// crea/aggiorna voce in libreria per un media (status/rating/commento)
router.post("/:mediaId", upsertUserMedia);

// aggiorna solo lo status (to_watch, watching, watched, favorite)
router.patch("/:mediaId/status", updateStatus);

// aggiorna rating/commento personale
router.patch("/:mediaId/rating", updateRating);

// rimuove dalla libreria
router.delete("/:mediaId", removeFromLibrary);

export default router;
