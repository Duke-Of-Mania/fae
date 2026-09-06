import { useEffect, useState } from "react";
import { getNpcs, createNpc, updateNpc, deleteNpc } from "../../services/npcs";
import { getCities } from "../../services/cities";

// NPCs list for a campaign, with an optional city assignment.
function NpcsSection({ campaignId, isGm }) {
  const [npcs, setNpcs] = useState([]);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [disposition, setDisposition] = useState("");
  const [cityId, setCityId] = useState("");

  async function refreshNpcs() {
    const data = await getNpcs(campaignId);
    setNpcs(data.npcs);
  }

  useEffect(() => {
    async function load() {
      try {
        const npcData = await getNpcs(campaignId);
        setNpcs(npcData.npcs);
        const cityData = await getCities(campaignId);
        setCities(cityData.cities);
      } catch (error) {
        setError(error.message);
      }
    }

    load();
  }, [campaignId]);

  function cityName(id) {
    return cities.find((city) => city.city_id === id)?.name;
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    try {
      await createNpc(campaignId, { name, role, disposition, cityId: cityId || null });
      setName("");
      setRole("");
      setDisposition("");
      setCityId("");
      await refreshNpcs();
    } catch (error) {
      setError(error.message);
    }
  }

  async function toggleVisible(npc) {
    try {
      await updateNpc(campaignId, npc.npc_id, { visibleToPlayers: !npc.visible_to_players });
      await refreshNpcs();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDelete(npcId) {
    try {
      await deleteNpc(campaignId, npcId);
      await refreshNpcs();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="panel">
      <h2>NPCs</h2>
      {error && <p className="form-error">{error}</p>}

      {npcs.length === 0 && <p className="entity-empty">No NPCs yet.</p>}

      <ul className="entity-list">
        {npcs.map((npc) => (
          <li className="entity-row" key={npc.npc_id}>
            <div className="entity-row-main">
              <strong>{npc.name}</strong>
              <span className="entity-row-meta">
                {[npc.role, npc.disposition, npc.city_id && cityName(npc.city_id)].filter(Boolean).join(" · ")}
              </span>
            </div>
            {isGm && (
              <div className="entity-row-actions">
                <span className={`badge ${npc.visible_to_players ? "badge-success" : "badge-muted"}`}>
                  {npc.visible_to_players ? "Visible" : "Hidden"}
                </span>
                <label>
                  <input
                    type="checkbox"
                    checked={npc.visible_to_players}
                    onChange={() => toggleVisible(npc)}
                  />
                  Visible to players
                </label>
                <button className="button-danger" type="button" onClick={() => handleDelete(npc.npc_id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {isGm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <input placeholder="NPC name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          <input placeholder="Role (optional)" type="text" value={role} onChange={(event) => setRole(event.target.value)} />
          <input placeholder="Disposition (optional)" type="text" value={disposition} onChange={(event) => setDisposition(event.target.value)} />
          <select value={cityId} onChange={(event) => setCityId(event.target.value)}>
            <option value="">(no city)</option>
            {cities.map((city) => (
              <option key={city.city_id} value={city.city_id}>{city.name}</option>
            ))}
          </select>
          <button className="button button-primary" type="submit">Add NPC</button>
        </form>
      )}
    </section>
  );
}

export default NpcsSection;
