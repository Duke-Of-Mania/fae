import pool from "../db/database.js";
import crypto from "crypto";
import { getCampaignAccess } from "../db/campaignAccess.js";

// Create a new character owned by the current user. Not attached
// to a campaign yet. class_name/ancestry/level are optional and
// deliberately freeform (not tied to any one ruleset).
export async function createCharacter(req, res) {
  try {
    const { name, className, ancestry, level } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Character name is required.",
      });
    }

    const characterId = crypto.randomUUID();

    const result = await pool.query(
      `
        INSERT INTO appdata.characters (character_id, owner_user_id, name, class_name, ancestry, level)
        VALUES ($1, $2, $3, $4, $5, COALESCE($6, 1))
        RETURNING character_id, name, class_name, ancestry, level, campaign_id, created_at, updated_at
      `,
      [characterId, req.user.user_id, name, className || null, ancestry || null, level || null]
    );

    return res.status(201).json({
      success: true,
      message: "Character created successfully.",
      character: result.rows[0],
    });
  } catch (error) {
    console.error("Create character error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}

// Shared by every owner-only endpoint below: confirms the character
// exists and belongs to the requester. Sends the response itself on
// failure; returns true only when the caller should proceed.
async function requireOwner(characterId, userId, res) {
  const result = await pool.query(
    `SELECT owner_user_id FROM appdata.characters WHERE character_id = $1`,
    [characterId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, message: "Character not found." });
    return false;
  }

  if (result.rows[0].owner_user_id !== userId) {
    res.status(403).json({ success: false, message: "You do not have access to this character." });
    return false;
  }

  return true;
}

// Fetch a character's full sheet, including its stats and
// resources. Accessible by the owner, or read-only by the GM of
// the character's current campaign (if it's in one).
export async function getCharacter(req, res) {
  try {
    const { characterId } = req.params;

    const result = await pool.query(
      `SELECT * FROM appdata.characters WHERE character_id = $1`,
      [characterId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Character not found." });
    }

    const character = result.rows[0];

    let role = null;
    if (character.owner_user_id === req.user.user_id) {
      role = "owner";
    } else if (character.campaign_id) {
      const access = await getCampaignAccess(character.campaign_id, req.user.user_id);
      if (access.role === "gm") role = "gm";
    }

    if (!role) {
      return res.status(403).json({ success: false, message: "You do not have access to this character." });
    }

    const stats = await pool.query(
      `SELECT stat_name, stat_value, sort_order FROM appdata.character_stats WHERE character_id = $1 ORDER BY sort_order ASC, stat_name ASC`,
      [characterId]
    );
    const resources = await pool.query(
      `SELECT resource_name, current_value, max_value, sort_order FROM appdata.character_resources WHERE character_id = $1 ORDER BY sort_order ASC, resource_name ASC`,
      [characterId]
    );

    return res.status(200).json({
      success: true,
      character: { ...character, role, stats: stats.rows, resources: resources.rows },
    });
  } catch (error) {
    console.error("Get character error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Update a character's identity/flavor fields. Owner-only.
export async function updateCharacter(req, res) {
  try {
    const { characterId } = req.params;
    const {
      name = null,
      className = null,
      ancestry = null,
      level = null,
      appearance = null,
      personality = null,
      backstory = null,
      notes = null,
    } = req.body;

    if (!(await requireOwner(characterId, req.user.user_id, res))) return;

    const result = await pool.query(
      `
        UPDATE appdata.characters
        SET
          name = COALESCE($1, name),
          class_name = COALESCE($2, class_name),
          ancestry = COALESCE($3, ancestry),
          level = COALESCE($4, level),
          appearance = COALESCE($5, appearance),
          personality = COALESCE($6, personality),
          backstory = COALESCE($7, backstory),
          notes = COALESCE($8, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE character_id = $9
        RETURNING character_id, name, class_name, ancestry, level, campaign_id, appearance, personality, backstory, notes, created_at, updated_at
      `,
      [name, className, ancestry, level, appearance, personality, backstory, notes, characterId]
    );

    return res.status(200).json({
      success: true,
      message: "Character updated successfully.",
      character: result.rows[0],
    });
  } catch (error) {
    console.error("Update character error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Delete a character. Owner-only.
export async function deleteCharacter(req, res) {
  try {
    const { characterId } = req.params;

    if (!(await requireOwner(characterId, req.user.user_id, res))) return;

    await pool.query(`DELETE FROM appdata.characters WHERE character_id = $1`, [characterId]);

    return res.status(200).json({ success: true, message: "Character deleted successfully." });
  } catch (error) {
    console.error("Delete character error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Add or update a named stat (e.g. "Strength" -> "15"). Owner-only.
export async function upsertStat(req, res) {
  try {
    const { characterId } = req.params;
    const { statName, statValue, sortOrder } = req.body;

    if (!(await requireOwner(characterId, req.user.user_id, res))) return;

    if (!statName) {
      return res.status(400).json({ success: false, message: "statName is required." });
    }

    const result = await pool.query(
      `
        INSERT INTO appdata.character_stats (character_id, stat_name, stat_value, sort_order)
        VALUES ($1, $2, $3, COALESCE($4, 0))
        ON CONFLICT (character_id, stat_name) DO UPDATE
          SET stat_value = COALESCE($3, appdata.character_stats.stat_value),
              sort_order = COALESCE($4, appdata.character_stats.sort_order)
        RETURNING stat_name, stat_value, sort_order
      `,
      [characterId, statName, statValue ?? null, sortOrder ?? null]
    );

    return res.status(200).json({ success: true, stat: result.rows[0] });
  } catch (error) {
    console.error("Upsert stat error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Remove a stat. Owner-only.
export async function deleteStat(req, res) {
  try {
    const { characterId, statName } = req.params;

    if (!(await requireOwner(characterId, req.user.user_id, res))) return;

    await pool.query(
      `DELETE FROM appdata.character_stats WHERE character_id = $1 AND stat_name = $2`,
      [characterId, statName]
    );

    return res.status(200).json({ success: true, message: "Stat removed." });
  } catch (error) {
    console.error("Delete stat error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Add or update a tracked resource (e.g. "Hit Points" 24/24). Owner-only.
export async function upsertResource(req, res) {
  try {
    const { characterId } = req.params;
    const { resourceName, currentValue, maxValue, sortOrder } = req.body;

    if (!(await requireOwner(characterId, req.user.user_id, res))) return;

    if (!resourceName) {
      return res.status(400).json({ success: false, message: "resourceName is required." });
    }

    const result = await pool.query(
      `
        INSERT INTO appdata.character_resources (character_id, resource_name, current_value, max_value, sort_order)
        VALUES ($1, $2, $3, $4, COALESCE($5, 0))
        ON CONFLICT (character_id, resource_name) DO UPDATE
          SET current_value = COALESCE($3, appdata.character_resources.current_value),
              max_value = COALESCE($4, appdata.character_resources.max_value),
              sort_order = COALESCE($5, appdata.character_resources.sort_order)
        RETURNING resource_name, current_value, max_value, sort_order
      `,
      [characterId, resourceName, currentValue ?? null, maxValue ?? null, sortOrder ?? null]
    );

    return res.status(200).json({ success: true, resource: result.rows[0] });
  } catch (error) {
    console.error("Upsert resource error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// Remove a resource. Owner-only.
export async function deleteResource(req, res) {
  try {
    const { characterId, resourceName } = req.params;

    if (!(await requireOwner(characterId, req.user.user_id, res))) return;

    await pool.query(
      `DELETE FROM appdata.character_resources WHERE character_id = $1 AND resource_name = $2`,
      [characterId, resourceName]
    );

    return res.status(200).json({ success: true, message: "Resource removed." });
  } catch (error) {
    console.error("Delete resource error:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
}

// List every character owned by the current user, along with the
// name of the campaign it's currently in (if any).
export async function listMyCharacters(req, res) {
  try {
    const result = await pool.query(
      `
        SELECT
          ch.character_id,
          ch.name,
          ch.class_name,
          ch.level,
          ch.campaign_id,
          c.name AS campaign_name,
          ch.created_at
        FROM appdata.characters ch
        LEFT JOIN appdata.campaigns c ON c.campaign_id = ch.campaign_id
        WHERE ch.owner_user_id = $1
        ORDER BY ch.created_at ASC
      `,
      [req.user.user_id]
    );

    return res.status(200).json({
      success: true,
      characters: result.rows,
    });
  } catch (error) {
    console.error("List characters error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}

// Attach one of the current user's characters to a campaign using
// that campaign's invite code. A character can only be in one
// campaign at a time, so this overwrites any previous assignment.
export async function joinCampaign(req, res) {
  try {
    const { characterId } = req.params;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: "Invite code is required.",
      });
    }

    if (!(await requireOwner(characterId, req.user.user_id, res))) return;

    const campaign = await pool.query(
      `SELECT campaign_id, name FROM appdata.campaigns WHERE invite_code = $1`,
      [inviteCode]
    );

    if (campaign.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid invite code.",
      });
    }

    const result = await pool.query(
      `
        UPDATE appdata.characters
        SET campaign_id = $1
        WHERE character_id = $2
        RETURNING character_id, name, campaign_id, created_at
      `,
      [campaign.rows[0].campaign_id, characterId]
    );

    return res.status(200).json({
      success: true,
      message: `Joined ${campaign.rows[0].name}.`,
      character: result.rows[0],
    });
  } catch (error) {
    console.error("Join campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}

// Remove one of the current user's characters from its campaign.
export async function leaveCampaign(req, res) {
  try {
    const { characterId } = req.params;

    if (!(await requireOwner(characterId, req.user.user_id, res))) return;

    const result = await pool.query(
      `
        UPDATE appdata.characters
        SET campaign_id = NULL
        WHERE character_id = $1
        RETURNING character_id, name, campaign_id, created_at
      `,
      [characterId]
    );

    return res.status(200).json({
      success: true,
      message: "Left the campaign.",
      character: result.rows[0],
    });
  } catch (error) {
    console.error("Leave campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}
