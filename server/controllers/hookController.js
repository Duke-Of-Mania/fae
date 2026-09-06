import pool from "../db/database.js";
import crypto from "crypto";
import { getCampaignAccess } from "../db/campaignAccess.js";

// Loads a quest and confirms it belongs to this campaign.
async function loadQuestInCampaign(questId, campaignId) {
  const result = await pool.query(
    `SELECT quest_id, visible_to_players FROM appdata.quests WHERE quest_id = $1 AND campaign_id = $2`,
    [questId, campaignId]
  );
  return result.rows[0] || null;
}

// Loads a hook by id, joined with its quest, and confirms the
// quest belongs to this campaign.
async function loadHookInCampaign(hookId, campaignId) {
  const result = await pool.query(
    `
      SELECT h.hook_id, h.quest_id, h.title, h.status, h.notes, h.visible_to_players,
             h.created_at, h.updated_at, q.visible_to_players AS quest_visible_to_players
      FROM appdata.hooks h
      JOIN appdata.quests q ON q.quest_id = h.quest_id
      WHERE h.hook_id = $1 AND q.campaign_id = $2
    `,
    [hookId, campaignId]
  );
  return result.rows[0] || null;
}

async function attachLinkedEntities(hook, campaignId) {
  const npcs = await pool.query(
    `
      SELECT n.npc_id, n.name FROM appdata.hook_npcs hn
      JOIN appdata.npcs n ON n.npc_id = hn.npc_id
      WHERE hn.hook_id = $1
    `,
    [hook.hook_id]
  );
  const cities = await pool.query(
    `
      SELECT c.city_id, c.name FROM appdata.hook_cities hc
      JOIN appdata.cities c ON c.city_id = hc.city_id
      WHERE hc.hook_id = $1
    `,
    [hook.hook_id]
  );
  return { ...hook, npcs: npcs.rows, cities: cities.rows };
}

// Create a hook under a quest. GM only.
export async function createHook(req, res) {
  try {
    const { campaignId, questId } = req.params;
    const { title, notes, visibleToPlayers } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    if (!(await loadQuestInCampaign(questId, campaignId))) {
      return res.status(404).json({ success: false, message: "Quest not found." });
    }

    if (!title) {
      return res.status(400).json({ success: false, message: "Hook title is required." });
    }

    const hookId = crypto.randomUUID();

    const result = await pool.query(
      `
        INSERT INTO appdata.hooks (hook_id, quest_id, title, notes, visible_to_players)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING hook_id, quest_id, title, status, notes, visible_to_players, created_at, updated_at
      `,
      [hookId, questId, title, notes || null, Boolean(visibleToPlayers)]
    );

    return res.status(201).json({ success: true, message: "Hook created successfully.", hook: result.rows[0] });
  } catch (error) {
    console.error("Create hook error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// List the hooks under a quest. If the quest itself is hidden from
// a player, this looks like "quest not found" - the hooks under a
// still-secret quest shouldn't be discoverable either.
export async function listHooks(req, res) {
  try {
    const { campaignId, questId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (!access.role) {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const quest = await loadQuestInCampaign(questId, campaignId);
    if (!quest || (access.role !== "gm" && !quest.visible_to_players)) {
      return res.status(404).json({ success: false, message: "Quest not found." });
    }

    const visibilityFilter = access.role === "gm" ? "" : "AND visible_to_players = TRUE";

    const result = await pool.query(
      `
        SELECT hook_id, quest_id, title, status, notes, visible_to_players, created_at, updated_at
        FROM appdata.hooks
        WHERE quest_id = $1 ${visibilityFilter}
        ORDER BY created_at ASC
      `,
      [questId]
    );

    return res.status(200).json({ success: true, hooks: result.rows });
  } catch (error) {
    console.error("List hooks error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Fetch a single hook, including the NPCs/Cities linked to it.
export async function getHook(req, res) {
  try {
    const { campaignId, hookId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (!access.role) {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    const hook = await loadHookInCampaign(hookId, campaignId);
    if (!hook) {
      return res.status(404).json({ success: false, message: "Hook not found." });
    }

    if (access.role !== "gm" && (!hook.quest_visible_to_players || !hook.visible_to_players)) {
      return res.status(404).json({ success: false, message: "Hook not found." });
    }

    delete hook.quest_visible_to_players;

    return res.status(200).json({ success: true, hook: await attachLinkedEntities(hook, campaignId) });
  } catch (error) {
    console.error("Get hook error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Update a hook. GM only.
export async function updateHook(req, res) {
  try {
    const { campaignId, hookId } = req.params;
    const { title = null, status = null, notes = null, visibleToPlayers = null } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    if (!(await loadHookInCampaign(hookId, campaignId))) {
      return res.status(404).json({ success: false, message: "Hook not found." });
    }

    const result = await pool.query(
      `
        UPDATE appdata.hooks
        SET
          title = COALESCE($1, title),
          status = COALESCE($2, status),
          notes = COALESCE($3, notes),
          visible_to_players = COALESCE($4, visible_to_players),
          updated_at = CURRENT_TIMESTAMP
        WHERE hook_id = $5
        RETURNING hook_id, quest_id, title, status, notes, visible_to_players, created_at, updated_at
      `,
      [title, status, notes, visibleToPlayers, hookId]
    );

    return res.status(200).json({ success: true, message: "Hook updated successfully.", hook: result.rows[0] });
  } catch (error) {
    console.error("Update hook error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Delete a hook. GM only.
export async function deleteHook(req, res) {
  try {
    const { campaignId, hookId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }

    if (!(await loadHookInCampaign(hookId, campaignId))) {
      return res.status(404).json({ success: false, message: "Hook not found." });
    }

    await pool.query(`DELETE FROM appdata.hooks WHERE hook_id = $1`, [hookId]);

    return res.status(200).json({ success: true, message: "Hook deleted successfully." });
  } catch (error) {
    console.error("Delete hook error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Link an NPC to a hook. GM only.
export async function linkNpc(req, res) {
  try {
    const { campaignId, hookId } = req.params;
    const { npcId } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }
    if (!(await loadHookInCampaign(hookId, campaignId))) {
      return res.status(404).json({ success: false, message: "Hook not found." });
    }

    const npcCheck = await pool.query(
      `SELECT 1 FROM appdata.npcs WHERE npc_id = $1 AND campaign_id = $2`,
      [npcId, campaignId]
    );
    if (npcCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: "That NPC does not belong to this campaign." });
    }

    await pool.query(
      `INSERT INTO appdata.hook_npcs (hook_id, npc_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [hookId, npcId]
    );

    return res.status(200).json({ success: true, message: "NPC linked to hook." });
  } catch (error) {
    console.error("Link NPC to hook error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Unlink an NPC from a hook. GM only.
export async function unlinkNpc(req, res) {
  try {
    const { campaignId, hookId, npcId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }
    if (!(await loadHookInCampaign(hookId, campaignId))) {
      return res.status(404).json({ success: false, message: "Hook not found." });
    }

    await pool.query(`DELETE FROM appdata.hook_npcs WHERE hook_id = $1 AND npc_id = $2`, [hookId, npcId]);

    return res.status(200).json({ success: true, message: "NPC unlinked from hook." });
  } catch (error) {
    console.error("Unlink NPC from hook error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Link a city to a hook. GM only.
export async function linkCity(req, res) {
  try {
    const { campaignId, hookId } = req.params;
    const { cityId } = req.body;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }
    if (!(await loadHookInCampaign(hookId, campaignId))) {
      return res.status(404).json({ success: false, message: "Hook not found." });
    }

    const cityCheck = await pool.query(
      `SELECT 1 FROM appdata.cities WHERE city_id = $1 AND campaign_id = $2`,
      [cityId, campaignId]
    );
    if (cityCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: "That city does not belong to this campaign." });
    }

    await pool.query(
      `INSERT INTO appdata.hook_cities (hook_id, city_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [hookId, cityId]
    );

    return res.status(200).json({ success: true, message: "City linked to hook." });
  } catch (error) {
    console.error("Link city to hook error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Unlink a city from a hook. GM only.
export async function unlinkCity(req, res) {
  try {
    const { campaignId, hookId, cityId } = req.params;

    const access = await getCampaignAccess(campaignId, req.user.user_id);
    if (!access.exists) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    if (access.role !== "gm") {
      return res.status(403).json({ success: false, message: "You do not have access to this campaign." });
    }
    if (!(await loadHookInCampaign(hookId, campaignId))) {
      return res.status(404).json({ success: false, message: "Hook not found." });
    }

    await pool.query(`DELETE FROM appdata.hook_cities WHERE hook_id = $1 AND city_id = $2`, [hookId, cityId]);

    return res.status(200).json({ success: true, message: "City unlinked from hook." });
  } catch (error) {
    console.error("Unlink city from hook error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}
