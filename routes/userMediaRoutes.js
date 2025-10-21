
import { Router } from "express";
import {
 listUserMedia,
  upsertUserMedia,
  updateStatus,
  updateRating,
  removeFromLibrary,
  createComment,
  listComments,
  updateComment,
  deleteComment
} from "../controllers/userMediaController.js";

const router = Router();

// Libreria
router.get("/", listUserMedia);
router.post("/:mediaId", upsertUserMedia);
router.patch("/:mediaId/status", updateStatus);
router.patch("/:mediaId/rating", updateRating);
router.delete("/:mediaId", removeFromLibrary);

// Commenti
router.post("/:mediaId/comments", createComment);
router.get("/:mediaId/comments", listComments);
router.patch("/:mediaId/comments/:commentId", updateComment);
router.delete("/:mediaId/comments/:commentId", deleteComment);

export default router;
