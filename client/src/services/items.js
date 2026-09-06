import { apiRequest } from "./apiClient.js";

// Items are a GM-only catalog used to stock shop inventories.
export async function getItems(campaignId) {
  return apiRequest(`/campaigns/${campaignId}/items`);
}

export async function createItem(campaignId, { name, description, value }) {
  return apiRequest(`/campaigns/${campaignId}/items`, {
    method: "POST",
    body: JSON.stringify({ name, description, value }),
  });
}

export async function deleteItem(campaignId, itemId) {
  return apiRequest(`/campaigns/${campaignId}/items/${itemId}`, {
    method: "DELETE",
  });
}
