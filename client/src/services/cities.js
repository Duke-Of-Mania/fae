import { apiRequest } from "./apiClient.js";

export async function getCities(campaignId) {
  return apiRequest(`/campaigns/${campaignId}/cities`);
}

export async function createCity(campaignId, { name, region, notes }) {
  return apiRequest(`/campaigns/${campaignId}/cities`, {
    method: "POST",
    body: JSON.stringify({ name, region, notes }),
  });
}

export async function updateCity(campaignId, cityId, fields) {
  return apiRequest(`/campaigns/${campaignId}/cities/${cityId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export async function deleteCity(campaignId, cityId) {
  return apiRequest(`/campaigns/${campaignId}/cities/${cityId}`, {
    method: "DELETE",
  });
}
