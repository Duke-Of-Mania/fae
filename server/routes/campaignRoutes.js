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

const router = express.Router();

router.use(authenticateUser);

router.post("/", createCampaign);
router.get("/", listCampaigns);
router.get("/:campaignId", getCampaign);
router.get("/:campaignId/roster", getCampaignRoster);
router.patch("/:campaignId", updateCampaign);
router.delete("/:campaignId", deleteCampaign);

export default router;
