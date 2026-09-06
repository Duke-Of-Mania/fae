import pool from "../db/database.js";
import crypto from "crypto";

// Create a new character owned by the current user. Not attached
// to a campaign yet.
export async function createCharacter(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Character name is required.",
      });
    }

    const characterId = crypto.randomUUID();

    const result = await pool.query(
      `
        INSERT INTO appdata.characters (character_id, owner_user_id, name)
        VALUES ($1, $2, $3)
        RETURNING character_id, name, campaign_id, created_at
      `,
      [characterId, req.user.user_id, name]
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

// List every character owned by the current user, along with the
// name of the campaign it's currently in (if any).
export async function listMyCharacters(req, res) {
  try {
    const result = await pool.query(
      `
        SELECT
          ch.character_id,
          ch.name,
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

    const character = await pool.query(
      `SELECT owner_user_id FROM appdata.characters WHERE character_id = $1`,
      [characterId]
    );

    if (character.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Character not found.",
      });
    }

    if (character.rows[0].owner_user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this character.",
      });
    }

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

    const character = await pool.query(
      `SELECT owner_user_id FROM appdata.characters WHERE character_id = $1`,
      [characterId]
    );

    if (character.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Character not found.",
      });
    }

    if (character.rows[0].owner_user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this character.",
      });
    }

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
