import pool from "./database.js";

/*
 * getCampaignAccess
 *
 * Determines whether a user can access a campaign, and in what
 * role. The GM (the campaign's owner) always has full access.
 * A player has read-only access if one of their characters is
 * in that campaign's roster (characters.campaign_id).
 *
 * Returns:
 *   { exists: false, role: null }              - no such campaign
 *   { exists: true, role: "gm" | "player" }     - has access
 *   { exists: true, role: null }                - exists, no access
 */
export async function getCampaignAccess(campaignId, userId) {
  const campaignResult = await pool.query(
    `SELECT owner_user_id FROM appdata.campaigns WHERE campaign_id = $1`,
    [campaignId]
  );

  if (campaignResult.rows.length === 0) {
    return { exists: false, role: null };
  }

  if (campaignResult.rows[0].owner_user_id === userId) {
    return { exists: true, role: "gm" };
  }

  const characterResult = await pool.query(
    `
      SELECT 1 FROM appdata.characters
      WHERE campaign_id = $1 AND owner_user_id = $2
      LIMIT 1
    `,
    [campaignId, userId]
  );

  return {
    exists: true,
    role: characterResult.rows.length > 0 ? "player" : null,
  };
}
