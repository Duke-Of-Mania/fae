import express from "express";

import {
  createCity,
  listCities,
  getCity,
  updateCity,
  deleteCity,
} from "../controllers/cityController.js";

// mergeParams so this router can read :campaignId from the
// parent router it's mounted under (campaignRoutes.js).
const router = express.Router({ mergeParams: true });

router.post("/", createCity);
router.get("/", listCities);
router.get("/:cityId", getCity);
router.patch("/:cityId", updateCity);
router.delete("/:cityId", deleteCity);

export default router;
