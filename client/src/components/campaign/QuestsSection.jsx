import { useEffect, useState } from "react";
import {
  getQuests, createQuest, updateQuest, deleteQuest,
  getHooks, createHook, updateHook, deleteHook, getHook,
  linkNpcToHook, unlinkNpcFromHook, linkCityToHook, unlinkCityFromHook,
} from "../../services/quests";
import { getCities } from "../../services/cities";
import { getNpcs } from "../../services/npcs";

function QuestsSection({ campaignId, isGm }) {
  const [quests, setQuests] = useState([]);
  const [cities, setCities] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");

  const [expandedQuestId, setExpandedQuestId] = useState(null);
  const [hooks, setHooks] = useState([]);
  const [hookTitle, setHookTitle] = useState("");

  const [expandedHookId, setExpandedHookId] = useState(null);
  const [hookDetail, setHookDetail] = useState(null);
  const [linkNpcId, setLinkNpcId] = useState("");
  const [linkCityId, setLinkCityId] = useState("");

  async function refreshQuests() {
    const data = await getQuests(campaignId);
    setQuests(data.quests);
  }

  useEffect(() => {
    async function load() {
      try {
        const questData = await getQuests(campaignId);
        setQuests(questData.quests);
        const cityData = await getCities(campaignId);
        setCities(cityData.cities);
        const npcData = await getNpcs(campaignId);
        setNpcs(npcData.npcs);
      } catch (error) {
        setError(error.message);
      }
    }

    load();
  }, [campaignId]);

  async function handleCreateQuest(event) {
    event.preventDefault();
    setError("");
    try {
      await createQuest(campaignId, { title });
      setTitle("");
      await refreshQuests();
    } catch (error) {
      setError(error.message);
    }
  }

  async function toggleQuestVisible(quest) {
    try {
      await updateQuest(campaignId, quest.quest_id, { visibleToPlayers: !quest.visible_to_players });
      await refreshQuests();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDeleteQuest(questId) {
    try {
      await deleteQuest(campaignId, questId);
      if (expandedQuestId === questId) setExpandedQuestId(null);
      await refreshQuests();
    } catch (error) {
      setError(error.message);
    }
  }

  async function toggleQuestHooks(questId) {
    if (expandedQuestId === questId) {
      setExpandedQuestId(null);
      return;
    }
    setExpandedQuestId(questId);
    setExpandedHookId(null);
    try {
      const data = await getHooks(campaignId, questId);
      setHooks(data.hooks);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleCreateHook(event, questId) {
    event.preventDefault();
    setError("");
    try {
      await createHook(campaignId, questId, { title: hookTitle });
      setHookTitle("");
      const data = await getHooks(campaignId, questId);
      setHooks(data.hooks);
    } catch (error) {
      setError(error.message);
    }
  }

  async function toggleHookVisible(hook, questId) {
    try {
      await updateHook(campaignId, hook.hook_id, { visibleToPlayers: !hook.visible_to_players });
      const data = await getHooks(campaignId, questId);
      setHooks(data.hooks);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDeleteHook(hookId, questId) {
    try {
      await deleteHook(campaignId, hookId);
      if (expandedHookId === hookId) setExpandedHookId(null);
      const data = await getHooks(campaignId, questId);
      setHooks(data.hooks);
    } catch (error) {
      setError(error.message);
    }
  }

  async function toggleHookLinks(hookId) {
    if (expandedHookId === hookId) {
      setExpandedHookId(null);
      return;
    }
    setExpandedHookId(hookId);
    try {
      const data = await getHook(campaignId, hookId);
      setHookDetail(data.hook);
    } catch (error) {
      setError(error.message);
    }
  }

  async function refreshHookDetail(hookId) {
    const data = await getHook(campaignId, hookId);
    setHookDetail(data.hook);
  }

  async function handleLinkNpc(hookId) {
    if (!linkNpcId) return;
    try {
      await linkNpcToHook(campaignId, hookId, linkNpcId);
      setLinkNpcId("");
      await refreshHookDetail(hookId);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleUnlinkNpc(hookId, npcId) {
    try {
      await unlinkNpcFromHook(campaignId, hookId, npcId);
      await refreshHookDetail(hookId);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleLinkCity(hookId) {
    if (!linkCityId) return;
    try {
      await linkCityToHook(campaignId, hookId, linkCityId);
      setLinkCityId("");
      await refreshHookDetail(hookId);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleUnlinkCity(hookId, cityId) {
    try {
      await unlinkCityFromHook(campaignId, hookId, cityId);
      await refreshHookDetail(hookId);
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section>
      <h2>Quests</h2>
      {error && <p className="form-error">{error}</p>}

      {isGm && (
        <form onSubmit={handleCreateQuest}>
          <div className="form-field">
            <label htmlFor="quest-title">Title</label>
            <input id="quest-title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <button className="button button-primary" type="submit">Add Quest</button>
        </form>
      )}

      {quests.length === 0 && <p>No quests yet.</p>}

      <ul>
        {quests.map((quest) => (
          <li key={quest.quest_id}>
            <strong>{quest.title}</strong> ({quest.status})
            {" "}
            <button type="button" onClick={() => toggleQuestHooks(quest.quest_id)}>
              {expandedQuestId === quest.quest_id ? "Hide Hooks" : "Show Hooks"}
            </button>
            {isGm && (
              <>
                {" "}
                <label>
                  <input type="checkbox" checked={quest.visible_to_players} onChange={() => toggleQuestVisible(quest)} />
                  Visible to players
                </label>
                {" "}
                <button type="button" onClick={() => handleDeleteQuest(quest.quest_id)}>Delete</button>
              </>
            )}

            {expandedQuestId === quest.quest_id && (
              <div>
                {isGm && (
                  <form onSubmit={(event) => handleCreateHook(event, quest.quest_id)}>
                    <input
                      type="text"
                      placeholder="Hook title"
                      value={hookTitle}
                      onChange={(event) => setHookTitle(event.target.value)}
                    />
                    <button type="submit">Add Hook</button>
                  </form>
                )}

                {hooks.length === 0 && <p>No hooks yet.</p>}

                <ul>
                  {hooks.map((hook) => (
                    <li key={hook.hook_id}>
                      {hook.title} ({hook.status})
                      {" "}
                      <button type="button" onClick={() => toggleHookLinks(hook.hook_id)}>
                        {expandedHookId === hook.hook_id ? "Hide Links" : "Show Links"}
                      </button>
                      {isGm && (
                        <>
                          {" "}
                          <label>
                            <input
                              type="checkbox"
                              checked={hook.visible_to_players}
                              onChange={() => toggleHookVisible(hook, quest.quest_id)}
                            />
                            Visible to players
                          </label>
                          {" "}
                          <button type="button" onClick={() => handleDeleteHook(hook.hook_id, quest.quest_id)}>Delete</button>
                        </>
                      )}

                      {expandedHookId === hook.hook_id && hookDetail && (
                        <div>
                          <p>NPCs involved:</p>
                          <ul>
                            {hookDetail.npcs.map((npc) => (
                              <li key={npc.npc_id}>
                                {npc.name}
                                {isGm && (
                                  <button type="button" onClick={() => handleUnlinkNpc(hook.hook_id, npc.npc_id)}>Unlink</button>
                                )}
                              </li>
                            ))}
                            {hookDetail.npcs.length === 0 && <li>None linked.</li>}
                          </ul>
                          {isGm && (
                            <div>
                              <select value={linkNpcId} onChange={(event) => setLinkNpcId(event.target.value)}>
                                <option value="">Select NPC...</option>
                                {npcs.map((npc) => (
                                  <option key={npc.npc_id} value={npc.npc_id}>{npc.name}</option>
                                ))}
                              </select>
                              <button type="button" onClick={() => handleLinkNpc(hook.hook_id)}>Link NPC</button>
                            </div>
                          )}

                          <p>Cities involved:</p>
                          <ul>
                            {hookDetail.cities.map((city) => (
                              <li key={city.city_id}>
                                {city.name}
                                {isGm && (
                                  <button type="button" onClick={() => handleUnlinkCity(hook.hook_id, city.city_id)}>Unlink</button>
                                )}
                              </li>
                            ))}
                            {hookDetail.cities.length === 0 && <li>None linked.</li>}
                          </ul>
                          {isGm && (
                            <div>
                              <select value={linkCityId} onChange={(event) => setLinkCityId(event.target.value)}>
                                <option value="">Select city...</option>
                                {cities.map((city) => (
                                  <option key={city.city_id} value={city.city_id}>{city.name}</option>
                                ))}
                              </select>
                              <button type="button" onClick={() => handleLinkCity(hook.hook_id)}>Link City</button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default QuestsSection;
