import pool from "../db/database.js";
import crypto from "crypto";
import { getCampaignAccess } from "../db/campaignAccess.js";

// Create a city in a campaign. GM only.
export async function createCity(req, res) {
  try {
    const { campaignId } = req.params;
    const { name, region, notes, visibleToPlayers } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    if (!name) {
      return res.status(400).json({ success: false, message: "City name is required." });
    }

    const cityId = crypto.randomUUID();

    const result = await pool.query(
      `
        INSERT INTO appdata.cities (city_id, campaign_id, name, region, notes, visible_to_players)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING city_id, campaign_id, name, region, notes, visible_to_players, created_at, updated_at
      `,
      [cityId, campaignId, name, region || null, notes || null, Boolean(visibleToPlayers)]
    );

    return res.status(201).json({ success: true, message: "City created successfully.", city: result.rows[0] });
  } catch (error) {
    console.error("Create city error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// List a campaign's cities. GM sees all; a player only sees
// cities toggled visible.
export async function listCities(req, res) {
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
        SELECT city_id, campaign_id, name, region, notes, visible_to_players, created_at, updated_at
        FROM appdata.cities
        WHERE campaign_id = $1 ${visibilityFilter}
        ORDER BY name ASC
      `,
      [campaignId]
    );

    return res.status(200).json({ success: true, cities: result.rows });
  } catch (error) {
    console.error("List cities error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Fetch a single city. A hidden city looks like "not found" to a
// player, so its existence isn't leaked before the GM reveals it.
export async function getCity(req, res) {
  try {
    const { campaignId, cityId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (!access.role) {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const result = await pool.query(
      `
        SELECT city_id, campaign_id, name, region, notes, visible_to_players, created_at, updated_at
        FROM appdata.cities
        WHERE city_id = $1 AND campaign_id = $2
      `,
      [cityId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "City not found." });
    }

    const city = result.rows[0];

    if (access.role !== "gm" && !city.visible_to_players) {
      return res.status(404).json({ success: false, message: "City not found." });
    }

    return res.status(200).json({ success: true, city });
  } catch (error) {
    console.error("Get city error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Update a city. GM only.
export async function updateCity(req, res) {
  try {
    const { campaignId, cityId } = req.params;
    const { name = null, region = null, notes = null, visibleToPlayers = null } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const result = await pool.query(
      `
        UPDATE appdata.cities
        SET
          name = COALESCE($1, name),
          region = COALESCE($2, region),
          notes = COALESCE($3, notes),
          visible_to_players = COALESCE($4, visible_to_players),
          updated_at = CURRENT_TIMESTAMP
        WHERE city_id = $5 AND campaign_id = $6
        RETURNING city_id, campaign_id, name, region, notes, visible_to_players, created_at, updated_at
      `,
      [name, region, notes, visibleToPlayers, cityId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "City not found." });
    }

    return res.status(200).json({ success: true, message: "City updated successfully.", city: result.rows[0] });
  } catch (error) {
    console.error("Update city error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Delete a city. GM only.
export async function deleteCity(req, res) {
  try {
    const { campaignId, cityId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const result = await pool.query(
      `DELETE FROM appdata.cities WHERE city_id = $1 AND campaign_id = $2 RETURNING city_id`,
      [cityId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "City not found." });
    }

    return res.status(200).json({ success: true, message: "City deleted successfully." });
  } catch (error) {
    console.error("Delete city error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}
