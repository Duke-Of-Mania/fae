import express from "express";

import {
  createCampaign,
  listCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignRoster,
} from "../controllers/campaignController.js";

// Every campaign route requires a valid session.
import { authenticateUser } from "../middleware/authenticate.js";

// Phase 3 world-content sub-resources, each scoped under a campaign.
import cityRoutes from "./cityRoutes.js";
import npcRoutes from "./npcRoutes.js";
import itemRoutes from "./itemRoutes.js";
import shopRoutes from "./shopRoutes.js";
import questRoutes from "./questRoutes.js";
import hookRoutes from "./hookRoutes.js";

const router = express.Router();

router.use(authenticateUser);

router.post("/", createCampaign);
router.get("/", listCampaigns);
router.get("/:campaignId", getCampaign);
router.get("/:campaignId/roster", getCampaignRoster);
router.patch("/:campaignId", updateCampaign);
router.delete("/:campaignId", deleteCampaign);

router.use("/:campaignId/cities", cityRoutes);
router.use("/:campaignId/npcs", npcRoutes);
router.use("/:campaignId/items", itemRoutes);
router.use("/:campaignId/shops", shopRoutes);
router.use("/:campaignId/quests", questRoutes);
router.use("/:campaignId/hooks", hookRoutes);

export default router;
