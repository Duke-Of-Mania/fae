import { apiRequest } from "./apiClient.js";

/*
 * createCampaign
 *
 * Creates a new campaign owned by the current user.
 */
export async function createCampaign({ name, overview, worldOverview }) {
  return apiRequest("/campaigns", {
    method: "POST",
    body: JSON.stringify({ name, overview, worldOverview }),
  });
}

/*
 * getCampaigns
 *
 * Lists every campaign owned by the current user.
 */
export async function getCampaigns() {
  return apiRequest("/campaigns");
}

/*
 * getCampaign
 *
 * Fetches a single campaign by id.
 */
export async function getCampaign(campaignId) {
  return apiRequest(`/campaigns/${campaignId}`);
}

/*
 * getCampaignRoster
 *
 * Lists the characters on a campaign's roster.
 */
export async function getCampaignRoster(campaignId) {
  return apiRequest(`/campaigns/${campaignId}/roster`);
}

/*
 * updateCampaign
 *
 * Updates a campaign's editable fields. Only the fields
 * provided are changed.
 */
export async function updateCampaign(campaignId, { name, overview, worldOverview, status }) {
  return apiRequest(`/campaigns/${campaignId}`, {
    method: "PATCH",
    body: JSON.stringify({ name, overview, worldOverview, status }),
  });
}

/*
 * deleteCampaign
 *
 * Permanently deletes a campaign.
 */
export async function deleteCampaign(campaignId) {
  return apiRequest(`/campaigns/${campaignId}`, {
    method: "DELETE",
  });
}
