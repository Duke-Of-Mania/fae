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
    <section>
      <h2>NPCs</h2>
      {error && <p className="form-error">{error}</p>}

      {isGm && (
        <form onSubmit={handleCreate}>
          <div className="form-field">
            <label htmlFor="npc-name">Name</label>
            <input id="npc-name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="npc-role">Role</label>
            <input id="npc-role" type="text" value={role} onChange={(event) => setRole(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="npc-disposition">Disposition</label>
            <input id="npc-disposition" type="text" value={disposition} onChange={(event) => setDisposition(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="npc-city">City</label>
            <select id="npc-city" value={cityId} onChange={(event) => setCityId(event.target.value)}>
              <option value="">(none)</option>
              {cities.map((city) => (
                <option key={city.city_id} value={city.city_id}>{city.name}</option>
              ))}
            </select>
          </div>
          <button className="button button-primary" type="submit">Add NPC</button>
        </form>
      )}

      {npcs.length === 0 && <p>No NPCs yet.</p>}

      <ul>
        {npcs.map((npc) => (
          <li key={npc.npc_id}>
            <strong>{npc.name}</strong>
            {npc.role && ` - ${npc.role}`}
            {npc.disposition && ` (${npc.disposition})`}
            {npc.city_id && ` @ ${cityName(npc.city_id) || "?"}`}
            {isGm && (
              <>
                {" "}
                <label>
                  <input
                    type="checkbox"
                    checked={npc.visible_to_players}
                    onChange={() => toggleVisible(npc)}
                  />
                  Visible to players
                </label>
                {" "}
                <button type="button" onClick={() => handleDelete(npc.npc_id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default NpcsSection;
