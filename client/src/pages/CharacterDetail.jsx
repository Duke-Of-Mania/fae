import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import {
  getCharacter,
  updateCharacter,
  deleteCharacter,
  upsertStat,
  deleteStat,
  upsertResource,
  deleteResource,
} from "../services/characters";

// Views and edits a single character sheet. The owner gets full
// edit access; the GM of the character's current campaign gets a
// read-only view (the server enforces this - the UI just mirrors
// it). Ability-score-like stats and HP-like resources are generic
// named rows rather than fixed fields, so this works for any
// ruleset, not just D&D.
function CharacterDetail() {
  const { characterId } = useParams();
  const navigate = useNavigate();

  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [ancestry, setAncestry] = useState("");
  const [level, setLevel] = useState("1");
  const [appearance, setAppearance] = useState("");
  const [personality, setPersonality] = useState("");
  const [backstory, setBackstory] = useState("");
  const [notes, setNotes] = useState("");

  const [statName, setStatName] = useState("");
  const [statValue, setStatValue] = useState("");

  const [resourceName, setResourceName] = useState("");
  const [resourceCurrent, setResourceCurrent] = useState("");
  const [resourceMax, setResourceMax] = useState("");

  function applyCharacter(data) {
    setCharacter(data);
    setName(data.name);
    setClassName(data.class_name || "");
    setAncestry(data.ancestry || "");
    setLevel(String(data.level));
    setAppearance(data.appearance || "");
    setPersonality(data.personality || "");
    setBackstory(data.backstory || "");
    setNotes(data.notes || "");
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await getCharacter(characterId);
        applyCharacter(data.character);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [characterId]);

  async function refresh() {
    const data = await getCharacter(characterId);
    applyCharacter(data.character);
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");

    try {
      await updateCharacter(characterId, {
        name, className, ancestry, level: level ? Number(level) : null,
        appearance, personality, backstory, notes,
      });
      await refresh();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDelete() {
    setError("");

    try {
      await deleteCharacter(characterId);
      navigate("/app/characters");
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleAddStat(event) {
    event.preventDefault();
    setError("");

    try {
      await upsertStat(characterId, { statName, statValue });
      setStatName("");
      setStatValue("");
      await refresh();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleRemoveStat(name) {
    try {
      await deleteStat(characterId, name);
      await refresh();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleAddResource(event) {
    event.preventDefault();
    setError("");

    try {
      await upsertResource(characterId, {
        resourceName,
        currentValue: resourceCurrent ? Number(resourceCurrent) : null,
        maxValue: resourceMax ? Number(resourceMax) : null,
      });
      setResourceName("");
      setResourceCurrent("");
      setResourceMax("");
      await refresh();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleRemoveResource(name) {
    try {
      await deleteResource(characterId, name);
      await refresh();
    } catch (error) {
      setError(error.message);
    }
  }

  if (loading) {
    return <p>Loading character...</p>;
  }

  if (error && !character) {
    return (
      <main>
        <p className="form-error">{error}</p>
        <Link to="/app/characters">Back to Characters</Link>
      </main>
    );
  }

  const isOwner = character.role === "owner";

  return (
    <main>
      <Link to="/app/characters">Back to Characters</Link>

      <h1>{character.name}</h1>

      {error && <p className="form-error">{error}</p>}

      {isOwner ? (
        <form onSubmit={handleSave}>
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="className">Class</label>
            <input id="className" type="text" value={className} onChange={(event) => setClassName(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="ancestry">Ancestry</label>
            <input id="ancestry" type="text" value={ancestry} onChange={(event) => setAncestry(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="level">Level</label>
            <input id="level" type="number" min="1" value={level} onChange={(event) => setLevel(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="appearance">Appearance</label>
            <textarea id="appearance" value={appearance} onChange={(event) => setAppearance(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="personality">Personality</label>
            <textarea id="personality" value={personality} onChange={(event) => setPersonality(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="backstory">Backstory</label>
            <textarea id="backstory" value={backstory} onChange={(event) => setBackstory(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          <button className="button button-primary" type="submit">Save Changes</button>
        </form>
      ) : (
        <section>
          <p>{className && `${className} - `}{ancestry && `${ancestry} - `}Level {level}</p>
          {appearance && <p><strong>Appearance:</strong> {appearance}</p>}
          {personality && <p><strong>Personality:</strong> {personality}</p>}
          {backstory && <p><strong>Backstory:</strong> {backstory}</p>}
          {notes && <p><strong>Notes:</strong> {notes}</p>}
        </section>
      )}

      <section>
        <h2>Stats</h2>
        <ul>
          {character.stats.map((stat) => (
            <li key={stat.stat_name}>
              {stat.stat_name}: {stat.stat_value}
              {isOwner && (
                <button type="button" onClick={() => handleRemoveStat(stat.stat_name)}>Remove</button>
              )}
            </li>
          ))}
          {character.stats.length === 0 && <li>None yet.</li>}
        </ul>
        {isOwner && (
          <form onSubmit={handleAddStat}>
            <input type="text" placeholder="Stat name (e.g. Strength)" value={statName} onChange={(event) => setStatName(event.target.value)} />
            <input type="text" placeholder="Value (e.g. 15)" value={statValue} onChange={(event) => setStatValue(event.target.value)} />
            <button type="submit">Add/Update Stat</button>
          </form>
        )}
      </section>

      <section>
        <h2>Resources</h2>
        <ul>
          {character.resources.map((resource) => (
            <li key={resource.resource_name}>
              {resource.resource_name}: {resource.current_value ?? "?"}/{resource.max_value ?? "?"}
              {isOwner && (
                <button type="button" onClick={() => handleRemoveResource(resource.resource_name)}>Remove</button>
              )}
            </li>
          ))}
          {character.resources.length === 0 && <li>None yet.</li>}
        </ul>
        {isOwner && (
          <form onSubmit={handleAddResource}>
            <input type="text" placeholder="Resource name (e.g. Hit Points)" value={resourceName} onChange={(event) => setResourceName(event.target.value)} />
            <input type="number" placeholder="Current" value={resourceCurrent} onChange={(event) => setResourceCurrent(event.target.value)} />
            <input type="number" placeholder="Max" value={resourceMax} onChange={(event) => setResourceMax(event.target.value)} />
            <button type="submit">Add/Update Resource</button>
          </form>
        )}
      </section>

      {isOwner && (
        <button type="button" onClick={handleDelete}>Delete Character</button>
      )}
    </main>
  );
}

export default CharacterDetail;
