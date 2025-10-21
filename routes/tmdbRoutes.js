
import { Router } from "express";
import { getDetails, search } from "../controllers/tmdbController.js";

const router = Router();
router.get("/search", search);
router.get("/:type/:id", getDetails);
export default router;
