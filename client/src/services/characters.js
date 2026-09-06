import { apiRequest } from "./apiClient.js";

/*
 * createCharacter
 *
 * Creates a new character owned by the current user. Not
 * attached to a campaign yet. className/ancestry/level are
 * optional and freeform (not tied to any one ruleset).
 */
export async function createCharacter({ name, className, ancestry, level }) {
  return apiRequest("/characters", {
    method: "POST",
    body: JSON.stringify({ name, className, ancestry, level }),
  });
}

/*
 * getMyCharacters
 *
 * Lists every character owned by the current user.
 */
export async function getMyCharacters() {
  return apiRequest("/characters");
}

/*
 * getCharacter
 *
 * Fetches a single character's full sheet, including its stats
 * and resources. Owner gets full access; the GM of the
 * character's current campaign gets a read-only view.
 */
export async function getCharacter(characterId) {
  return apiRequest(`/characters/${characterId}`);
}

/*
 * updateCharacter
 *
 * Updates a character's identity/flavor fields. Only the fields
 * provided are changed.
 */
export async function updateCharacter(characterId, fields) {
  return apiRequest(`/characters/${characterId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

/*
 * deleteCharacter
 *
 * Permanently deletes a character.
 */
export async function deleteCharacter(characterId) {
  return apiRequest(`/characters/${characterId}`, {
    method: "DELETE",
  });
}

/*
 * upsertStat / deleteStat
 *
 * Adds, updates, or removes a named stat (e.g. "Strength" -> "15").
 */
export async function upsertStat(characterId, { statName, statValue, sortOrder }) {
  return apiRequest(`/characters/${characterId}/stats`, {
    method: "POST",
    body: JSON.stringify({ statName, statValue, sortOrder }),
  });
}

export async function deleteStat(characterId, statName) {
  return apiRequest(`/characters/${characterId}/stats/${encodeURIComponent(statName)}`, {
    method: "DELETE",
  });
}

/*
 * upsertResource / deleteResource
 *
 * Adds, updates, or removes a tracked current/max resource
 * (e.g. "Hit Points" 24/24).
 */
export async function upsertResource(characterId, { resourceName, currentValue, maxValue, sortOrder }) {
  return apiRequest(`/characters/${characterId}/resources`, {
    method: "POST",
    body: JSON.stringify({ resourceName, currentValue, maxValue, sortOrder }),
  });
}

export async function deleteResource(characterId, resourceName) {
  return apiRequest(`/characters/${characterId}/resources/${encodeURIComponent(resourceName)}`, {
    method: "DELETE",
  });
}

/*
 * joinCampaign
 *
 * Attaches a character to a campaign using that campaign's
 * invite code. A character can only be in one campaign at a
 * time, so this replaces any previous assignment.
 */
export async function joinCampaign(characterId, inviteCode) {
  return apiRequest(`/characters/${characterId}/join`, {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}

/*
 * leaveCampaign
 *
 * Removes a character from its current campaign.
 */
export async function leaveCampaign(characterId) {
  return apiRequest(`/characters/${characterId}/leave`, {
    method: "POST",
  });
}
