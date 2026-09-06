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
    <main>
      <h1>Campaigns</h1>

      {error && <p className="form-error">{error}</p>}

      <section>
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

      <section>
        <h2>Your Campaigns</h2>

        {loading && <p>Loading campaigns...</p>}

        {!loading && campaigns.length === 0 && <p>No campaigns yet.</p>}

        <ul>
          {campaigns.map((campaign) => (
            <li key={campaign.campaign_id}>
              <Link to={`/app/campaigns/${campaign.campaign_id}`}>
                {campaign.name}
              </Link>
              {" "}
              <span>({campaign.status}, {campaign.role === "gm" ? "GM" : "Player"})</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default Campaigns;
