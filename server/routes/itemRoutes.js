import express from "express";

import { createItem, listItems, updateItem, deleteItem } from "../controllers/itemController.js";

const router = express.Router({ mergeParams: true });

router.post("/", createItem);
router.get("/", listItems);
router.patch("/:itemId", updateItem);
router.delete("/:itemId", deleteItem);

export default router;
