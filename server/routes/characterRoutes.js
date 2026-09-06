import express from "express";

import {
  createCharacter,
  listMyCharacters,
  getCharacter,
  updateCharacter,
  deleteCharacter,
  joinCampaign,
  leaveCampaign,
  upsertStat,
  deleteStat,
  upsertResource,
  deleteResource,
} from "../controllers/characterController.js";

import { authenticateUser } from "../middleware/authenticate.js";

const router = express.Router();

router.use(authenticateUser);

router.post("/", createCharacter);
router.get("/", listMyCharacters);
router.get("/:characterId", getCharacter);
router.patch("/:characterId", updateCharacter);
router.delete("/:characterId", deleteCharacter);

router.post("/:characterId/join", joinCampaign);
router.post("/:characterId/leave", leaveCampaign);

router.post("/:characterId/stats", upsertStat);
router.delete("/:characterId/stats/:statName", deleteStat);

router.post("/:characterId/resources", upsertResource);
router.delete("/:characterId/resources/:resourceName", deleteResource);

export default router;
