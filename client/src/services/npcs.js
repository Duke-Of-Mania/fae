import { apiRequest } from "./apiClient.js";

export async function getNpcs(campaignId) {
  return apiRequest(`/campaigns/${campaignId}/npcs`);
}

export async function createNpc(campaignId, { name, role, disposition, notes, cityId }) {
  return apiRequest(`/campaigns/${campaignId}/npcs`, {
    method: "POST",
    body: JSON.stringify({ name, role, disposition, notes, cityId }),
  });
}

export async function updateNpc(campaignId, npcId, fields) {
  return apiRequest(`/campaigns/${campaignId}/npcs/${npcId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export async function deleteNpc(campaignId, npcId) {
  return apiRequest(`/campaigns/${campaignId}/npcs/${npcId}`, {
    method: "DELETE",
  });
}
