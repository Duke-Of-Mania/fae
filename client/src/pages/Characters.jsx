import { useEffect, useState } from "react";

import {
  createCharacter,
  getMyCharacters,
  joinCampaign,
  leaveCampaign,
} from "../services/characters";

// This component lists the current user's characters, lets them
// create a new one, and attach/detach a character to a campaign
// using an invite code.
function Characters() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [inviteCodes, setInviteCodes] = useState({});

  async function refreshCharacters() {
    const data = await getMyCharacters();
    setCharacters(data.characters);
  }

  useEffect(() => {
    async function loadCharacters() {
      try {
        await refreshCharacters();
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadCharacters();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setError("");

    try {
      await createCharacter(name);
      setName("");
      await refreshCharacters();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleJoin(characterId) {
    setError("");

    try {
      await joinCampaign(characterId, inviteCodes[characterId] || "");
      await refreshCharacters();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleLeave(characterId) {
    setError("");

    try {
      await leaveCampaign(characterId);
      await refreshCharacters();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <main>
      <h1>Characters</h1>

      {error && <p className="form-error">{error}</p>}

      <section>
        <h2>New Character</h2>

        <form onSubmit={handleCreate}>
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              placeholder="Character name"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <button className="button button-primary" type="submit">
            Create Character
          </button>
        </form>
      </section>

      <section>
        <h2>Your Characters</h2>

        {loading && <p>Loading characters...</p>}

        {!loading && characters.length === 0 && <p>No characters yet.</p>}

        <ul>
          {characters.map((character) => (
            <li key={character.character_id}>
              <strong>{character.name}</strong>
              {" "}
              {character.campaign_id ? (
                <span>
                  In: {character.campaign_name}{" "}
                  <button type="button" onClick={() => handleLeave(character.character_id)}>
                    Leave
                  </button>
                </span>
              ) : (
                <span>
                  <input
                    type="text"
                    placeholder="Invite code"
                    value={inviteCodes[character.character_id] || ""}
                    onChange={(event) =>
                      setInviteCodes({
                        ...inviteCodes,
                        [character.character_id]: event.target.value,
                      })
                    }
                  />
                  <button type="button" onClick={() => handleJoin(character.character_id)}>
                    Join Campaign
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default Characters;
