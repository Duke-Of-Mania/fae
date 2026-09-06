import express from "express";

import {
  createCharacter,
  listMyCharacters,
  joinCampaign,
  leaveCampaign,
} from "../controllers/characterController.js";

import { authenticateUser } from "../middleware/authenticate.js";

const router = express.Router();

router.use(authenticateUser);

router.post("/", createCharacter);
router.get("/", listMyCharacters);
router.post("/:characterId/join", joinCampaign);
router.post("/:characterId/leave", leaveCampaign);

export default router;
