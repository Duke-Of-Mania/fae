import pool from "../db/database.js";
import crypto from "crypto";
import { getCampaignAccess } from "../db/campaignAccess.js";

async function validateBelongsToCampaign(table, idColumn, id, campaignId) {
  if (!id) return true;
  const result = await pool.query(
    `SELECT 1 FROM appdata.${table} WHERE ${idColumn} = $1 AND campaign_id = $2`,
    [id, campaignId]
  );
  return result.rows.length > 0;
}

// Create a shop in a campaign. GM only.
export async function createShop(req, res) {
  try {
    const { campaignId } = req.params;
    const { name, shopType, notes, cityId, ownerNpcId, visibleToPlayers } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    if (!name) {
      return res.status(400).json({ success: false, message: "Shop name is required." });
    }

    if (!(await validateBelongsToCampaign("cities", "city_id", cityId, campaignId))) {
      return res.status(400).json({ success: false, message: "That city does not belong to this campaign." });
    }
    if (!(await validateBelongsToCampaign("npcs", "npc_id", ownerNpcId, campaignId))) {
      return res.status(400).json({ success: false, message: "That NPC does not belong to this campaign." });
    }

    const shopId = crypto.randomUUID();

    const result = await pool.query(
      `
        INSERT INTO appdata.shops (shop_id, campaign_id, city_id, owner_npc_id, name, shop_type, notes, visible_to_players)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING shop_id, campaign_id, city_id, owner_npc_id, name, shop_type, notes, visible_to_players, created_at, updated_at
      `,
      [shopId, campaignId, cityId || null, ownerNpcId || null, name, shopType || null, notes || null, Boolean(visibleToPlayers)]
    );

    return res.status(201).json({ success: true, message: "Shop created successfully.", shop: result.rows[0] });
  } catch (error) {
    console.error("Create shop error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// List a campaign's shops. GM sees all; a player only sees shops
// toggled visible.
export async function listShops(req, res) {
  try {
    const { campaignId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (!access.role) {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const visibilityFilter = access.role === "gm" ? "" : "AND visible_to_players = TRUE";

    const result = await pool.query(
      `
        SELECT shop_id, campaign_id, city_id, owner_npc_id, name, shop_type, notes, visible_to_players, created_at, updated_at
        FROM appdata.shops
        WHERE campaign_id = $1 ${visibilityFilter}
        ORDER BY name ASC
      `,
      [campaignId]
    );

    return res.status(200).json({ success: true, shops: result.rows });
  } catch (error) {
    console.error("List shops error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Fetch a single shop. Hidden from players (looks like "not found")
// until the GM reveals it.
export async function getShop(req, res) {
  try {
    const { campaignId, shopId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (!access.role) {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const result = await pool.query(
      `
        SELECT shop_id, campaign_id, city_id, owner_npc_id, name, shop_type, notes, visible_to_players, created_at, updated_at
        FROM appdata.shops
        WHERE shop_id = $1 AND campaign_id = $2
      `,
      [shopId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Shop not found." });
    }

    const shop = result.rows[0];

    if (access.role !== "gm" && !shop.visible_to_players) {
      return res.status(404).json({ success: false, message: "Shop not found." });
    }

    return res.status(200).json({ success: true, shop });
  } catch (error) {
    console.error("Get shop error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Update a shop. GM only.
export async function updateShop(req, res) {
  try {
    const { campaignId, shopId } = req.params;
    const {
      name = null,
      shopType = null,
      notes = null,
      cityId = undefined,
      ownerNpcId = undefined,
      visibleToPlayers = null,
    } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    if (cityId !== undefined && cityId !== null && !(await validateBelongsToCampaign("cities", "city_id", cityId, campaignId))) {
      return res.status(400).json({ success: false, message: "That city does not belong to this campaign." });
    }
    if (ownerNpcId !== undefined && ownerNpcId !== null && !(await validateBelongsToCampaign("npcs", "npc_id", ownerNpcId, campaignId))) {
      return res.status(400).json({ success: false, message: "That NPC does not belong to this campaign." });
    }

    const result = await pool.query(
      `
        UPDATE appdata.shops
        SET
          name = COALESCE($1, name),
          shop_type = COALESCE($2, shop_type),
          notes = COALESCE($3, notes),
          city_id = CASE WHEN $4::boolean THEN $5::uuid ELSE city_id END,
          owner_npc_id = CASE WHEN $6::boolean THEN $7::uuid ELSE owner_npc_id END,
          visible_to_players = COALESCE($8, visible_to_players),
          updated_at = CURRENT_TIMESTAMP
        WHERE shop_id = $9 AND campaign_id = $10
        RETURNING shop_id, campaign_id, city_id, owner_npc_id, name, shop_type, notes, visible_to_players, created_at, updated_at
      `,
      [
        name, shopType, notes,
        cityId !== undefined, cityId || null,
        ownerNpcId !== undefined, ownerNpcId || null,
        visibleToPlayers, shopId, campaignId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Shop not found." });
    }

    return res.status(200).json({ success: true, message: "Shop updated successfully.", shop: result.rows[0] });
  } catch (error) {
    console.error("Update shop error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Delete a shop. GM only.
export async function deleteShop(req, res) {
  try {
    const { campaignId, shopId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const result = await pool.query(
      `DELETE FROM appdata.shops WHERE shop_id = $1 AND campaign_id = $2 RETURNING shop_id`,
      [shopId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Shop not found." });
    }

    return res.status(200).json({ success: true, message: "Shop deleted successfully." });
  } catch (error) {
    console.error("Delete shop error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Shared by the inventory endpoints: confirms the shop exists in
// this campaign and the requester can see it (same hidden->404
// treatment as getShop). Returns the shop row, or null after
// having already sent a response.
async function loadVisibleShop(campaignId, shopId, access, res) {
  const result = await pool.query(
    `SELECT shop_id, visible_to_players FROM appdata.shops WHERE shop_id = $1 AND campaign_id = $2`,
    [shopId, campaignId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, message: "Shop not found." });
    return null;
  }

  const shop = result.rows[0];

  if (access.role !== "gm" && !shop.visible_to_players) {
    res.status(404).json({ success: false, message: "Shop not found." });
    return null;
  }

  return shop;
}

// List a shop's inventory (item name/description/value plus this
// shop's quantity and sell price).
export async function listShopInventory(req, res) {
  try {
    const { campaignId, shopId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (!access.role) {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    if (!(await loadVisibleShop(campaignId, shopId, access, res))) return;

    const result = await pool.query(
      `
        SELECT
          i.item_id, i.name, i.description, i.value,
          si.quantity, si.sell_price
        FROM appdata.shop_inventory si
        JOIN appdata.items i ON i.item_id = si.item_id
        WHERE si.shop_id = $1
        ORDER BY i.name ASC
      `,
      [shopId]
    );

    return res.status(200).json({ success: true, inventory: result.rows });
  } catch (error) {
    console.error("List shop inventory error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Add or update an item in a shop's inventory. GM only.
export async function upsertShopInventoryItem(req, res) {
  try {
    const { campaignId, shopId } = req.params;
    const { itemId, quantity, sellPrice } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    if (!itemId) {
      return res.status(400).json({ success: false, message: "itemId is required." });
    }

    const shopCheck = await pool.query(
      `SELECT 1 FROM appdata.shops WHERE shop_id = $1 AND campaign_id = $2`,
      [shopId, campaignId]
    );
    if (shopCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Shop not found." });
    }

    if (!(await validateBelongsToCampaign("items", "item_id", itemId, campaignId))) {
      return res.status(400).json({ success: false, message: "That item does not belong to this campaign." });
    }

    const result = await pool.query(
      `
        INSERT INTO appdata.shop_inventory (shop_id, item_id, quantity, sell_price)
        VALUES ($1, $2, COALESCE($3, 1), $4)
        ON CONFLICT (shop_id, item_id) DO UPDATE
          SET quantity = COALESCE($3, appdata.shop_inventory.quantity),
              sell_price = COALESCE($4, appdata.shop_inventory.sell_price)
        RETURNING shop_id, item_id, quantity, sell_price
      `,
      [shopId, itemId, quantity ?? null, sellPrice ?? null]
    );

    return res.status(200).json({ success: true, message: "Inventory updated.", inventoryItem: result.rows[0] });
  } catch (error) {
    console.error("Update shop inventory error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Remove an item from a shop's inventory. GM only.
export async function removeShopInventoryItem(req, res) {
  try {
    const { campaignId, shopId, itemId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const result = await pool.query(
      `
        DELETE FROM appdata.shop_inventory
        USING appdata.shops
        WHERE shop_inventory.shop_id = shops.shop_id
          AND shop_inventory.shop_id = $1
          AND shop_inventory.item_id = $2
          AND shops.campaign_id = $3
        RETURNING shop_inventory.item_id
      `,
      [shopId, itemId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Inventory item not found." });
    }

    return res.status(200).json({ success: true, message: "Item removed from inventory." });
  } catch (error) {
    console.error("Remove shop inventory error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}
