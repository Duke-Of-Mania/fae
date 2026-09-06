import { useEffect, useState } from "react";
import { getCities, createCity, updateCity, deleteCity } from "../../services/cities";

// Cities list for a campaign. GMs can create, toggle visibility,
// and delete; players get a read-only list already filtered by
// the server to only what's been revealed.
function CitiesSection({ campaignId, isGm }) {
  const [cities, setCities] = useState([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");

  async function refresh() {
    const data = await getCities(campaignId);
    setCities(data.cities);
  }

  useEffect(() => {
    async function loadCities() {
      try {
        const data = await getCities(campaignId);
        setCities(data.cities);
      } catch (error) {
        setError(error.message);
      }
    }

    loadCities();
  }, [campaignId]);

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    try {
      await createCity(campaignId, { name, region });
      setName("");
      setRegion("");
      await refresh();
    } catch (error) {
      setError(error.message);
    }
  }

  async function toggleVisible(city) {
    try {
      await updateCity(campaignId, city.city_id, { visibleToPlayers: !city.visible_to_players });
      await refresh();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDelete(cityId) {
    try {
      await deleteCity(campaignId, cityId);
      await refresh();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section>
      <h2>Cities</h2>
      {error && <p className="form-error">{error}</p>}

      {isGm && (
        <form onSubmit={handleCreate}>
          <div className="form-field">
            <label htmlFor="city-name">Name</label>
            <input id="city-name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="city-region">Region</label>
            <input id="city-region" type="text" value={region} onChange={(event) => setRegion(event.target.value)} />
          </div>
          <button className="button button-primary" type="submit">Add City</button>
        </form>
      )}

      {cities.length === 0 && <p>No cities yet.</p>}

      <ul>
        {cities.map((city) => (
          <li key={city.city_id}>
            <strong>{city.name}</strong>
            {city.region && ` (${city.region})`}
            {isGm && (
              <>
                {" "}
                <label>
                  <input
                    type="checkbox"
                    checked={city.visible_to_players}
                    onChange={() => toggleVisible(city)}
                  />
                  Visible to players
                </label>
                {" "}
                <button type="button" onClick={() => handleDelete(city.city_id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CitiesSection;
