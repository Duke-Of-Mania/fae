import express from "express";

import {
  getHook,
  updateHook,
  deleteHook,
  linkNpc,
  unlinkNpc,
  linkCity,
  unlinkCity,
} from "../controllers/hookController.js";

// Everything here addresses a hook directly by id (a hook's own id
// is enough to find it - its quest is looked up internally).
const router = express.Router({ mergeParams: true });

router.get("/:hookId", getHook);
router.patch("/:hookId", updateHook);
router.delete("/:hookId", deleteHook);

router.post("/:hookId/npcs", linkNpc);
router.delete("/:hookId/npcs/:npcId", unlinkNpc);
router.post("/:hookId/cities", linkCity);
router.delete("/:hookId/cities/:cityId", unlinkCity);

export default router;
