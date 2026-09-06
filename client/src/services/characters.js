import { apiRequest } from "./apiClient.js";

/*
 * createCharacter
 *
 * Creates a new character owned by the current user. Not
 * attached to a campaign yet.
 */
export async function createCharacter(name) {
  return apiRequest("/characters", {
    method: "POST",
    body: JSON.stringify({ name }),
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
