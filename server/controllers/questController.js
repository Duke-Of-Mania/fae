import pool from "../db/database.js";
import crypto from "crypto";
import { getCampaignAccess } from "../db/campaignAccess.js";

// Create a quest in a campaign. GM only.
export async function createQuest(req, res) {
  try {
    const { campaignId } = req.params;
    const { title, notes, visibleToPlayers } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    if (!title) {
      return res.status(400).json({ success: false, message: "Quest title is required." });
    }

    const questId = crypto.randomUUID();

    const result = await pool.query(
      `
        INSERT INTO appdata.quests (quest_id, campaign_id, title, notes, visible_to_players)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING quest_id, campaign_id, title, status, notes, visible_to_players, created_at, updated_at
      `,
      [questId, campaignId, title, notes || null, Boolean(visibleToPlayers)]
    );

    return res.status(201).json({ success: true, message: "Quest created successfully.", quest: result.rows[0] });
  } catch (error) {
    console.error("Create quest error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// List a campaign's quests. GM sees all; a player only sees quests
// toggled visible.
export async function listQuests(req, res) {
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
        SELECT quest_id, campaign_id, title, status, notes, visible_to_players, created_at, updated_at
        FROM appdata.quests
        WHERE campaign_id = $1 ${visibilityFilter}
        ORDER BY created_at ASC
      `,
      [campaignId]
    );

    return res.status(200).json({ success: true, quests: result.rows });
  } catch (error) {
    console.error("List quests error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Fetch a single quest. Hidden from players (looks like "not
// found") until the GM reveals it.
export async function getQuest(req, res) {
  try {
    const { campaignId, questId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (!access.role) {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const result = await pool.query(
      `
        SELECT quest_id, campaign_id, title, status, notes, visible_to_players, created_at, updated_at
        FROM appdata.quests
        WHERE quest_id = $1 AND campaign_id = $2
      `,
      [questId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Quest not found." });
    }

    const quest = result.rows[0];

    if (access.role !== "gm" && !quest.visible_to_players) {
      return res.status(404).json({ success: false, message: "Quest not found." });
    }

    return res.status(200).json({ success: true, quest });
  } catch (error) {
    console.error("Get quest error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Update a quest. GM only.
export async function updateQuest(req, res) {
  try {
    const { campaignId, questId } = req.params;
    const { title = null, status = null, notes = null, visibleToPlayers = null } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const result = await pool.query(
      `
        UPDATE appdata.quests
        SET
          title = COALESCE($1, title),
          status = COALESCE($2, status),
          notes = COALESCE($3, notes),
          visible_to_players = COALESCE($4, visible_to_players),
          updated_at = CURRENT_TIMESTAMP
        WHERE quest_id = $5 AND campaign_id = $6
        RETURNING quest_id, campaign_id, title, status, notes, visible_to_players, created_at, updated_at
      `,
      [title, status, notes, visibleToPlayers, questId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Quest not found." });
    }

    return res.status(200).json({ success: true, message: "Quest updated successfully.", quest: result.rows[0] });
  } catch (error) {
    console.error("Update quest error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Delete a quest (cascades to its hooks). GM only.
export async function deleteQuest(req, res) {
  try {
    const { campaignId, questId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const result = await pool.query(
      `DELETE FROM appdata.quests WHERE quest_id = $1 AND campaign_id = $2 RETURNING quest_id`,
      [questId, campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Quest not found." });
    }

    return res.status(200).json({ success: true, message: "Quest deleted successfully." });
  } catch (error) {
    console.error("Delete quest error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}
