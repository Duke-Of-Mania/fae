import pool from "../db/database.js";
import crypto from "crypto";

/*
 * generateInviteCode
 *
 * Produces a short, shareable code a player can use to join a
 * campaign later (Phase 2). Generated now so the column doesn't
 * need a migration when that feature is built.
 */
function generateInviteCode() {
  return crypto.randomBytes(6).toString("hex");
}

// Create a new campaign owned by the current user.
export async function createCampaign(req, res) {
  try {
    const { name, overview, worldOverview } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Campaign name is required.",
      });
    }

    const campaignId = crypto.randomUUID();
    const inviteCode = generateInviteCode();

    const result = await pool.query(
      `
        INSERT INTO appdata.campaigns (
          campaign_id,
          owner_user_id,
          name,
          overview,
          world_overview,
          invite_code
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          campaign_id,
          name,
          overview,
          world_overview,
          status,
          invite_code,
          created_at,
          updated_at
      `,
      [campaignId, req.user.user_id, name, overview || null, worldOverview || null, inviteCode]
    );

    return res.status(201).json({
      success: true,
      message: "Campaign created successfully.",
      campaign: result.rows[0],
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}

// List every campaign owned by the current user.
export async function listCampaigns(req, res) {
  try {
    const result = await pool.query(
      `
        SELECT
          campaign_id,
          name,
          overview,
          status,
          created_at,
          updated_at
        FROM appdata.campaigns
        WHERE owner_user_id = $1
        ORDER BY updated_at DESC
      `,
      [req.user.user_id]
    );

    return res.status(200).json({
      success: true,
      campaigns: result.rows,
    });
  } catch (error) {
    console.error("List campaigns error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}

// Fetch a single campaign. Only the owning GM can view it in Phase 1.
export async function getCampaign(req, res) {
  try {
    const { campaignId } = req.params;

    const result = await pool.query(
      `
        SELECT
          campaign_id,
          owner_user_id,
          name,
          overview,
          world_overview,
          status,
          invite_code,
          created_at,
          updated_at
        FROM appdata.campaigns
        WHERE campaign_id = $1
      `,
      [campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    const campaign = result.rows[0];

    if (campaign.owner_user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this campaign.",
      });
    }

    return res.status(200).json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("Get campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}

// Update a campaign's editable fields. Owner (GM) only.
export async function updateCampaign(req, res) {
  try {
    const { campaignId } = req.params;
    const { name = null, overview = null, worldOverview = null, status = null } = req.body;

    const existing = await pool.query(
      `SELECT owner_user_id FROM appdata.campaigns WHERE campaign_id = $1`,
      [campaignId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    if (existing.rows[0].owner_user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this campaign.",
      });
    }

    const result = await pool.query(
      `
        UPDATE appdata.campaigns
        SET
          name = COALESCE($1, name),
          overview = COALESCE($2, overview),
          world_overview = COALESCE($3, world_overview),
          status = COALESCE($4, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE campaign_id = $5
        RETURNING
          campaign_id,
          name,
          overview,
          world_overview,
          status,
          invite_code,
          created_at,
          updated_at
      `,
      [name, overview, worldOverview, status, campaignId]
    );

    return res.status(200).json({
      success: true,
      message: "Campaign updated successfully.",
      campaign: result.rows[0],
    });
  } catch (error) {
    console.error("Update campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}

// Delete a campaign. Owner (GM) only.
export async function deleteCampaign(req, res) {
  try {
    const { campaignId } = req.params;

    const existing = await pool.query(
      `SELECT owner_user_id FROM appdata.campaigns WHERE campaign_id = $1`,
      [campaignId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    if (existing.rows[0].owner_user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this campaign.",
      });
    }

    await pool.query(`DELETE FROM appdata.campaigns WHERE campaign_id = $1`, [campaignId]);

    return res.status(200).json({
      success: true,
      message: "Campaign deleted successfully.",
    });
  } catch (error) {
    console.error("Delete campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
}
