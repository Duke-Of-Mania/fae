import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import { getCampaign, updateCampaign, deleteCampaign } from "../services/campaigns";

// This component views and edits a single campaign.
// Only the GM who owns the campaign can reach this successfully
// (the server returns 403/404 otherwise).
function CampaignDetail() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
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

  return (
    <main>
      <Link to="/app/campaigns">Back to Campaigns</Link>

      <h1>{campaign.name}</h1>

      <p>Invite code: {campaign.invite_code}</p>

      {error && <p className="form-error">{error}</p>}

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

      <button type="button" onClick={handleDelete}>
        Delete Campaign
      </button>
    </main>
  );
}

export default CampaignDetail;
