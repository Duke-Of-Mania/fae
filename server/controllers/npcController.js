import pool from "../db/database.js";
import crypto from "crypto";
import { getCampaignAccess } from "../db/campaignAccess.js";

// Confirms a city_id (if provided) belongs to this campaign, so an
// NPC can't be linked to another campaign's city.
async function validateCityInCampaign(cityId, campaignId) {
  if (!cityId) return true;
  const result = await pool.query(
    `SELECT 1 FROM appdata.cities WHERE city_id = $1 AND campaign_id = $2`,
    [cityId, campaignId]
  );
  return result.rows.length > 0;
}

// Create an NPC in a campaign. GM only.
export async function createNpc(req, res) {
  try {
    const { campaignId } = req.params;
    const { name, role, disposition, notes, cityId, visibleToPlayers } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    if (!name) {
      return res.status(400).json({ success: false, message: "NPC name is required." });
    }

    if (!(await validateCityInCampaign(cityId, campaignId))) {
      return res.status(400).json({ success: false, message: "That city does not belong to this campaign." });
    }

    const npcId = crypto.randomUUID();

    const result = await pool.query(
      `
        INSERT INTO appdata.npcs (npc_id, campaign_id, city_id, name, role, disposition, notes, visible_to_players)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING npc_id, campaign_id, city_id, name, role, disposition, notes, visible_to_players, created_at, updated_at
      `,
      [npcId, campaignId, cityId || null, name, role || null, disposition || null, notes || null, Boolean(visibleToPlayers)]
    );

    return res.status(201).json({ success: true, message: "NPC created successfully.", npc: result.rows[0] });
  } catch (error) {
    console.error("Create NPC error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// List a campaign's NPCs. GM sees all; a player only sees NPCs
// toggled visible.
export async function listNpcs(req, res) {
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
        SELECT npc_id, campaign_id, city_id, name, role, disposition, notes, visible_to_players, created_at, updated_at
        FROM appdata.npcs
        WHERE campaign_id = $1 ${visibilityFilter}
        ORDER BY name ASC
      `,
      [campaignId]
    );

    return res.status(200).json({ success: true, npcs: result.rows });
  } catch (error) {
    console.error("List NPCs error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Fetch a single NPC. A hidden NPC looks like "not found" to a
// player, so its existence isn't leaked before the GM reveals it.
export async function getNpc(req, res) {
  try {
    const { campaignId, npcId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (!access.role) {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const result = await pool.query(
      `
        SELECT npc_id, campaign_id, city_id, name, role, disposition, notes, visible_to_players, created_at, updated_at
        FROM appdata.npcs
        WHERE npc_id = $1 AND campaign_id = $2
      `,
      [npcId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "NPC not found." });
    }

    const npc = result.rows[0];

    if (access.role !== "gm" && !npc.visible_to_players) {
      return res.status(404).json({ success: false, message: "NPC not found." });
    }

    return res.status(200).json({ success: true, npc });
  } catch (error) {
    console.error("Get NPC error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Update an NPC. GM only.
export async function updateNpc(req, res) {
  try {
    const { campaignId, npcId } = req.params;
    const {
      name = null,
      role = null,
      disposition = null,
      notes = null,
      cityId = undefined,
      visibleToPlayers = null,
    } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    if (cityId !== undefined && cityId !== null && !(await validateCityInCampaign(cityId, campaignId))) {
      return res.status(400).json({ success: false, message: "That city does not belong to this campaign." });
    }

    const result = await pool.query(
      `
        UPDATE appdata.npcs
        SET
          name = COALESCE($1, name),
          role = COALESCE($2, role),
          disposition = COALESCE($3, disposition),
          notes = COALESCE($4, notes),
          city_id = CASE WHEN $5::boolean THEN $6::uuid ELSE city_id END,
          visible_to_players = COALESCE($7, visible_to_players),
          updated_at = CURRENT_TIMESTAMP
        WHERE npc_id = $8 AND campaign_id = $9
        RETURNING npc_id, campaign_id, city_id, name, role, disposition, notes, visible_to_players, created_at, updated_at
      `,
      [name, role, disposition, notes, cityId !== undefined, cityId || null, visibleToPlayers, npcId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "NPC not found." });
    }

    return res.status(200).json({ success: true, message: "NPC updated successfully.", npc: result.rows[0] });
  } catch (error) {
    console.error("Update NPC error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Delete an NPC. GM only.
export async function deleteNpc(req, res) {
  try {
    const { campaignId, npcId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const result = await pool.query(
      `DELETE FROM appdata.npcs WHERE npc_id = $1 AND campaign_id = $2 RETURNING npc_id`,
      [npcId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "NPC not found." });
    }

    return res.status(200).json({ success: true, message: "NPC deleted successfully." });
  } catch (error) {
    console.error("Delete NPC error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}
