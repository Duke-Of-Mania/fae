import { apiRequest } from "./apiClient.js";

export async function getShops(campaignId) {
  return apiRequest(`/campaigns/${campaignId}/shops`);
}

export async function createShop(campaignId, { name, shopType, notes, cityId, ownerNpcId }) {
  return apiRequest(`/campaigns/${campaignId}/shops`, {
    method: "POST",
    body: JSON.stringify({ name, shopType, notes, cityId, ownerNpcId }),
  });
}

export async function updateShop(campaignId, shopId, fields) {
  return apiRequest(`/campaigns/${campaignId}/shops/${shopId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export async function deleteShop(campaignId, shopId) {
  return apiRequest(`/campaigns/${campaignId}/shops/${shopId}`, {
    method: "DELETE",
  });
}

export async function getShopInventory(campaignId, shopId) {
  return apiRequest(`/campaigns/${campaignId}/shops/${shopId}/inventory`);
}

export async function upsertShopInventoryItem(campaignId, shopId, { itemId, quantity, sellPrice }) {
  return apiRequest(`/campaigns/${campaignId}/shops/${shopId}/inventory`, {
    method: "POST",
    body: JSON.stringify({ itemId, quantity, sellPrice }),
  });
}

export async function removeShopInventoryItem(campaignId, shopId, itemId) {
  return apiRequest(`/campaigns/${campaignId}/shops/${shopId}/inventory/${itemId}`, {
    method: "DELETE",
  });
}
