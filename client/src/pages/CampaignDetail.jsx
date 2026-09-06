import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import { getCampaign, updateCampaign, deleteCampaign, getCampaignRoster } from "../services/campaigns";

// This component views a single campaign. The GM (owner) can edit
// and delete it; a player (someone with a character on the roster)
// gets a read-only view. The server enforces this too - the UI
// just mirrors it.
function CampaignDetail() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [overview, setOverview] = useState("");
  const [worldOverview, setWorldOverview] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    async function loadCampaign() {
      try {
        const data = await getCampaign(campaignId);

        setCampaign(data.campaign);
        setName(data.campaign.name);
        setOverview(data.campaign.overview || "");
        setWorldOverview(data.campaign.world_overview || "");
        setStatus(data.campaign.status);

        const rosterData = await getCampaignRoster(campaignId);
        setRoster(rosterData.roster);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadCampaign();
  }, [campaignId]);

  async function handleSave(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await updateCampaign(campaignId, {
        name,
        overview,
        worldOverview,
        status,
      });

      setCampaign(data.campaign);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDelete() {
    setError("");

    try {
      await deleteCampaign(campaignId);

      navigate("/app/campaigns");
    } catch (error) {
      setError(error.message);
    }
  }

  if (loading) {
    return <p>Loading campaign...</p>;
  }

  if (error && !campaign) {
    return (
      <main>
        <p className="form-error">{error}</p>
        <Link to="/app/campaigns">Back to Campaigns</Link>
      </main>
    );
  }

  const isGm = campaign.role === "gm";

  return (
    <main>
      <Link to="/app/campaigns">Back to Campaigns</Link>

      <h1>{campaign.name}</h1>

      {isGm && <p>Invite code: {campaign.invite_code}</p>}

      {error && <p className="form-error">{error}</p>}

      <section>
        <h2>Roster</h2>
        {roster.length === 0 && <p>No characters yet.</p>}
        <ul>
          {roster.map((character) => (
            <li key={character.character_id}>{character.name}</li>
          ))}
        </ul>
      </section>

      {isGm ? (
        <form onSubmit={handleSave}>
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="overview">Overview</label>
            <textarea
              id="overview"
              value={overview}
              onChange={(event) => setOverview(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="worldOverview">World Overview</label>
            <textarea
              id="worldOverview"
              value={worldOverview}
              onChange={(event) => setWorldOverview(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button className="button button-primary" type="submit">
            Save Changes
          </button>
        </form>
      ) : (
        <section>
          <h2>Overview</h2>
          <p>{campaign.overview}</p>

          <h2>World Overview</h2>
          <p>{campaign.world_overview}</p>
        </section>
      )}

      {isGm && (
        <button type="button" onClick={handleDelete}>
          Delete Campaign
        </button>
      )}
    </main>
  );
}

export default CampaignDetail;
