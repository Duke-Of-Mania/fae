import pool from "../db/database.js";
import crypto from "crypto";
import { getCampaignAccess } from "../db/campaignAccess.js";

// Items are a GM-side catalog for building shop inventories from -
// they have no visible_to_players flag of their own. A player only
// ever sees an item through a shop's inventory, gated by that shop's
// visibility, so every item endpoint here is GM-only.
async function requireGm(campaignId, userId, res) {
  const access = await getCampaignAccess(campaignId, userId);
  if (!access.exists) {
    res.status(404).json({ success: false, message: "Campaign not found." });
    return null;
  }
  if (access.role !== "gm") {
    res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    return null;
  }
  return access;
}

export async function createItem(req, res) {
  try {
    const { campaignId } = req.params;
    const { name, description, value } = req.body;

    if (!(await requireGm(campaignId, req.user.user_id, res))) return;

    if (!name) {
      return res.status(400).json({ success: false, message: "Item name is required." });
    }

    const itemId = crypto.randomUUID();

    const result = await pool.query(
      `
        INSERT INTO appdata.items (item_id, campaign_id, name, description, value)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING item_id, campaign_id, name, description, value, created_at, updated_at
      `,
      [itemId, campaignId, name, description || null, value ?? null]
    );

    return res.status(201).json({ success: true, message: "Item created successfully.", item: result.rows[0] });
  } catch (error) {
    console.error("Create item error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

export async function listItems(req, res) {
  try {
    const { campaignId } = req.params;

    if (!(await requireGm(campaignId, req.user.user_id, res))) return;

    const result = await pool.query(
      `
        SELECT item_id, campaign_id, name, description, value, created_at, updated_at
        FROM appdata.items
        WHERE campaign_id = $1
        ORDER BY name ASC
      `,
      [campaignId]
    );

    return res.status(200).json({ success: true, items: result.rows });
  } catch (error) {
    console.error("List items error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

export async function updateItem(req, res) {
  try {
    const { campaignId, itemId } = req.params;
    const { name = null, description = null, value = null } = req.body;

    if (!(await requireGm(campaignId, req.user.user_id, res))) return;

    const result = await pool.query(
      `
        UPDATE appdata.items
        SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          value = COALESCE($3, value),
          updated_at = CURRENT_TIMESTAMP
        WHERE item_id = $4 AND campaign_id = $5
        RETURNING item_id, campaign_id, name, description, value, created_at, updated_at
      `,
      [name, description, value, itemId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    return res.status(200).json({ success: true, message: "Item updated successfully.", item: result.rows[0] });
  } catch (error) {
    console.error("Update item error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

export async function deleteItem(req, res) {
  try {
    const { campaignId, itemId } = req.params;

    if (!(await requireGm(campaignId, req.user.user_id, res))) return;

    const result = await pool.query(
      `DELETE FROM appdata.items WHERE item_id = $1 AND campaign_id = $2 RETURNING item_id`,
      [itemId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    return res.status(200).json({ success: true, message: "Item deleted successfully." });
  } catch (error) {
    console.error("Delete item error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}
