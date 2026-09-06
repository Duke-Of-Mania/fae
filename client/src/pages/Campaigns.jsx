import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { createCampaign, getCampaigns } from "../services/campaigns";

// This component lists the current user's campaigns and lets
// them create a new one.
function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [overview, setOverview] = useState("");

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const data = await getCampaigns();
        setCampaigns(data.campaigns);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setError("");

    try {
      await createCampaign({ name, overview });

      setName("");
      setOverview("");

      // Refresh the list so the new campaign shows up.
      const data = await getCampaigns();
      setCampaigns(data.campaigns);
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <>
      <div className="panel-header">
        <h1>Campaigns</h1>
      </div>

      {error && <p className="form-error">{error}</p>}

      <section className="panel">
        <h2>New Campaign</h2>

        <form onSubmit={handleCreate}>
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              placeholder="Campaign name"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="overview">Overview</label>
            <input
              id="overview"
              type="text"
              value={overview}
              placeholder="A short premise for the campaign"
              onChange={(event) => setOverview(event.target.value)}
            />
          </div>

          <button className="button button-primary" type="submit">
            Create Campaign
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Your Campaigns</h2>

        {loading && <p>Loading campaigns...</p>}

        {!loading && campaigns.length === 0 && <p className="entity-empty">No campaigns yet.</p>}

        <ul className="entity-list">
          {campaigns.map((campaign) => (
            <li className="entity-row" key={campaign.campaign_id}>
              <div className="entity-row-main">
                <Link to={`/app/campaigns/${campaign.campaign_id}`}>
                  {campaign.name}
                </Link>
                <span className={`badge ${campaign.status === "active" ? "badge-success" : "badge-muted"}`}>
                  {campaign.status}
                </span>
                <span className="badge badge-muted">
                  {campaign.role === "gm" ? "GM" : "Player"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default Campaigns;
