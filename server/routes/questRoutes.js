import express from "express";

import { createQuest, listQuests, getQuest, updateQuest, deleteQuest } from "../controllers/questController.js";
import { createHook, listHooks } from "../controllers/hookController.js";

const router = express.Router({ mergeParams: true });

router.post("/", createQuest);
router.get("/", listQuests);
router.get("/:questId", getQuest);
router.patch("/:questId", updateQuest);
router.delete("/:questId", deleteQuest);

// Hooks are created/listed within their quest.
router.post("/:questId/hooks", createHook);
router.get("/:questId/hooks", listHooks);

export default router;
