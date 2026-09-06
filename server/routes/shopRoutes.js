import express from "express";

import {
  createShop,
  listShops,
  getShop,
  updateShop,
  deleteShop,
  listShopInventory,
  upsertShopInventoryItem,
  removeShopInventoryItem,
} from "../controllers/shopController.js";

const router = express.Router({ mergeParams: true });

router.post("/", createShop);
router.get("/", listShops);
router.get("/:shopId", getShop);
router.patch("/:shopId", updateShop);
router.delete("/:shopId", deleteShop);

router.get("/:shopId/inventory", listShopInventory);
router.post("/:shopId/inventory", upsertShopInventoryItem);
router.delete("/:shopId/inventory/:itemId", removeShopInventoryItem);

export default router;
