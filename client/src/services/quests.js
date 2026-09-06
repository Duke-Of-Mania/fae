import { apiRequest } from "./apiClient.js";

export async function getQuests(campaignId) {
  return apiRequest(`/campaigns/${campaignId}/quests`);
}

export async function createQuest(campaignId, { title, notes }) {
  return apiRequest(`/campaigns/${campaignId}/quests`, {
    method: "POST",
    body: JSON.stringify({ title, notes }),
  });
}

export async function updateQuest(campaignId, questId, fields) {
  return apiRequest(`/campaigns/${campaignId}/quests/${questId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export async function deleteQuest(campaignId, questId) {
  return apiRequest(`/campaigns/${campaignId}/quests/${questId}`, {
    method: "DELETE",
  });
}

export async function getHooks(campaignId, questId) {
  return apiRequest(`/campaigns/${campaignId}/quests/${questId}/hooks`);
}

export async function createHook(campaignId, questId, { title, notes }) {
  return apiRequest(`/campaigns/${campaignId}/quests/${questId}/hooks`, {
    method: "POST",
    body: JSON.stringify({ title, notes }),
  });
}

export async function getHook(campaignId, hookId) {
  return apiRequest(`/campaigns/${campaignId}/hooks/${hookId}`);
}

export async function updateHook(campaignId, hookId, fields) {
  return apiRequest(`/campaigns/${campaignId}/hooks/${hookId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export async function deleteHook(campaignId, hookId) {
  return apiRequest(`/campaigns/${campaignId}/hooks/${hookId}`, {
    method: "DELETE",
  });
}

export async function linkNpcToHook(campaignId, hookId, npcId) {
  return apiRequest(`/campaigns/${campaignId}/hooks/${hookId}/npcs`, {
    method: "POST",
    body: JSON.stringify({ npcId }),
  });
}

export async function unlinkNpcFromHook(campaignId, hookId, npcId) {
  return apiRequest(`/campaigns/${campaignId}/hooks/${hookId}/npcs/${npcId}`, {
    method: "DELETE",
  });
}

export async function linkCityToHook(campaignId, hookId, cityId) {
  return apiRequest(`/campaigns/${campaignId}/hooks/${hookId}/cities`, {
    method: "POST",
    body: JSON.stringify({ cityId }),
  });
}

export async function unlinkCityFromHook(campaignId, hookId, cityId) {
  return apiRequest(`/campaigns/${campaignId}/hooks/${hookId}/cities/${cityId}`, {
    method: "DELETE",
  });
}
