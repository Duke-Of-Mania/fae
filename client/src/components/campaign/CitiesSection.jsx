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
    <section className="panel">
      <h2>Cities</h2>
      {error && <p className="form-error">{error}</p>}

      {cities.length === 0 && <p className="entity-empty">No cities yet.</p>}

      <ul className="entity-list">
        {cities.map((city) => (
          <li className="entity-row" key={city.city_id}>
            <div className="entity-row-main">
              <strong>{city.name}</strong>
              {city.region && <span className="entity-row-meta">{city.region}</span>}
            </div>
            {isGm && (
              <div className="entity-row-actions">
                <span className={`badge ${city.visible_to_players ? "badge-success" : "badge-muted"}`}>
                  {city.visible_to_players ? "Visible" : "Hidden"}
                </span>
                <label>
                  <input
                    type="checkbox"
                    checked={city.visible_to_players}
                    onChange={() => toggleVisible(city)}
                  />
                  Visible to players
                </label>
                <button className="button-danger" type="button" onClick={() => handleDelete(city.city_id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {isGm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <input placeholder="City name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          <input placeholder="Region (optional)" type="text" value={region} onChange={(event) => setRegion(event.target.value)} />
          <button className="button button-primary" type="submit">Add City</button>
        </form>
      )}
    </section>
  );
}

export default CitiesSection;
