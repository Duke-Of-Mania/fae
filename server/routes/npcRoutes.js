import express from "express";

import {
  createNpc,
  listNpcs,
  getNpc,
  updateNpc,
  deleteNpc,
} from "../controllers/npcController.js";

const router = express.Router({ mergeParams: true });

router.post("/", createNpc);
router.get("/", listNpcs);
router.get("/:npcId", getNpc);
router.patch("/:npcId", updateNpc);
router.delete("/:npcId", deleteNpc);

export default router;
