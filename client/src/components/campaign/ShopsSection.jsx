import { useEffect, useState } from "react";
import { getShops, createShop, updateShop, deleteShop, getShopInventory, upsertShopInventoryItem, removeShopInventoryItem } from "../../services/shops";
import { getCities } from "../../services/cities";
import { getNpcs } from "../../services/npcs";
import { getItems, createItem } from "../../services/items";

function ShopsSection({ campaignId, isGm }) {
  const [shops, setShops] = useState([]);
  const [cities, setCities] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [shopType, setShopType] = useState("");
  const [cityId, setCityId] = useState("");
  const [ownerNpcId, setOwnerNpcId] = useState("");

  const [itemName, setItemName] = useState("");
  const [itemValue, setItemValue] = useState("");

  const [expandedShopId, setExpandedShopId] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [invItemId, setInvItemId] = useState("");
  const [invQuantity, setInvQuantity] = useState("1");
  const [invSellPrice, setInvSellPrice] = useState("");

  async function refreshShops() {
    const data = await getShops(campaignId);
    setShops(data.shops);
  }

  async function refreshItems() {
    if (!isGm) return;
    const data = await getItems(campaignId);
    setItems(data.items);
  }

  useEffect(() => {
    async function load() {
      try {
        const shopData = await getShops(campaignId);
        setShops(shopData.shops);
        const cityData = await getCities(campaignId);
        setCities(cityData.cities);
        const npcData = await getNpcs(campaignId);
        setNpcs(npcData.npcs);
        if (isGm) {
          const itemData = await getItems(campaignId);
          setItems(itemData.items);
        }
      } catch (error) {
        setError(error.message);
      }
    }

    load();
  }, [campaignId, isGm]);

  function cityName(id) {
    return cities.find((city) => city.city_id === id)?.name;
  }
  function npcName(id) {
    return npcs.find((npc) => npc.npc_id === id)?.name;
  }

  async function handleCreateShop(event) {
    event.preventDefault();
    setError("");
    try {
      await createShop(campaignId, { name, shopType, cityId: cityId || null, ownerNpcId: ownerNpcId || null });
      setName("");
      setShopType("");
      setCityId("");
      setOwnerNpcId("");
      await refreshShops();
    } catch (error) {
      setError(error.message);
    }
  }

  async function toggleVisible(shop) {
    try {
      await updateShop(campaignId, shop.shop_id, { visibleToPlayers: !shop.visible_to_players });
      await refreshShops();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDeleteShop(shopId) {
    try {
      await deleteShop(campaignId, shopId);
      await refreshShops();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleCreateItem(event) {
    event.preventDefault();
    setError("");
    try {
      await createItem(campaignId, { name: itemName, value: itemValue ? Number(itemValue) : null });
      setItemName("");
      setItemValue("");
      await refreshItems();
    } catch (error) {
      setError(error.message);
    }
  }

  async function toggleInventory(shopId) {
    if (expandedShopId === shopId) {
      setExpandedShopId(null);
      return;
    }
    setExpandedShopId(shopId);
    try {
      const data = await getShopInventory(campaignId, shopId);
      setInventory(data.inventory);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleAddInventory(event, shopId) {
    event.preventDefault();
    setError("");
    try {
      await upsertShopInventoryItem(campaignId, shopId, {
        itemId: invItemId,
        quantity: invQuantity ? Number(invQuantity) : null,
        sellPrice: invSellPrice ? Number(invSellPrice) : null,
      });
      setInvItemId("");
      setInvQuantity("1");
      setInvSellPrice("");
      const data = await getShopInventory(campaignId, shopId);
      setInventory(data.inventory);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleRemoveInventory(shopId, itemId) {
    try {
      await removeShopInventoryItem(campaignId, shopId, itemId);
      const data = await getShopInventory(campaignId, shopId);
      setInventory(data.inventory);
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="panel">
      <h2>Shops</h2>
      {error && <p className="form-error">{error}</p>}

      {shops.length === 0 && <p className="entity-empty">No shops yet.</p>}

      <ul className="entity-list">
        {shops.map((shop) => (
          <li className="entity-row" key={shop.shop_id}>
            <div className="entity-row-main">
              <strong>{shop.name}</strong>
              <span className="entity-row-meta">
                {[shop.shop_type, shop.city_id && cityName(shop.city_id), shop.owner_npc_id && `owned by ${npcName(shop.owner_npc_id) || "?"}`]
                  .filter(Boolean).join(" · ")}
              </span>
            </div>

            <div className="entity-row-actions">
              <button type="button" onClick={() => toggleInventory(shop.shop_id)}>
                {expandedShopId === shop.shop_id ? "Hide Inventory" : "Show Inventory"}
              </button>
              {isGm && (
                <>
                  <span className={`badge ${shop.visible_to_players ? "badge-success" : "badge-muted"}`}>
                    {shop.visible_to_players ? "Visible" : "Hidden"}
                  </span>
                  <label>
                    <input
                      type="checkbox"
                      checked={shop.visible_to_players}
                      onChange={() => toggleVisible(shop)}
                    />
                    Visible to players
                  </label>
                  <button className="button-danger" type="button" onClick={() => handleDeleteShop(shop.shop_id)}>Delete</button>
                </>
              )}
            </div>

            {expandedShopId === shop.shop_id && (
              <div className="entity-nested">
                <ul className="entity-list">
                  {inventory.map((line) => (
                    <li className="entity-row" key={line.item_id}>
                      <div className="entity-row-main">
                        <span>{line.name}</span>
                        <span className="entity-row-meta">
                          qty {line.quantity} · {line.sell_price != null ? `${line.sell_price}gp` : "no price"}
                        </span>
                      </div>
                      {isGm && (
                        <button className="button-danger" type="button" onClick={() => handleRemoveInventory(shop.shop_id, line.item_id)}>Remove</button>
                      )}
                    </li>
                  ))}
                  {inventory.length === 0 && <li className="entity-empty">Empty.</li>}
                </ul>

                {isGm && (
                  <form className="inline-form" onSubmit={(event) => handleAddInventory(event, shop.shop_id)}>
                    <select value={invItemId} onChange={(event) => setInvItemId(event.target.value)}>
                      <option value="">Select item...</option>
                      {items.map((item) => (
                        <option key={item.item_id} value={item.item_id}>{item.name}</option>
                      ))}
                    </select>
                    <input type="number" placeholder="Qty" value={invQuantity} onChange={(event) => setInvQuantity(event.target.value)} />
                    <input type="number" step="0.01" placeholder="Sell price" value={invSellPrice} onChange={(event) => setInvSellPrice(event.target.value)} />
                    <button className="button button-primary" type="submit">Add to Inventory</button>
                  </form>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {isGm && (
        <form className="inline-form" onSubmit={handleCreateShop}>
          <input placeholder="Shop name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          <input placeholder="Type (optional)" type="text" value={shopType} onChange={(event) => setShopType(event.target.value)} />
          <select value={cityId} onChange={(event) => setCityId(event.target.value)}>
            <option value="">(no city)</option>
            {cities.map((city) => (
              <option key={city.city_id} value={city.city_id}>{city.name}</option>
            ))}
          </select>
          <select value={ownerNpcId} onChange={(event) => setOwnerNpcId(event.target.value)}>
            <option value="">(no owner)</option>
            {npcs.map((npc) => (
              <option key={npc.npc_id} value={npc.npc_id}>{npc.name}</option>
            ))}
          </select>
          <button className="button button-primary" type="submit">Add Shop</button>
        </form>
      )}

      {isGm && (
        <>
          <h3>Item Catalog</h3>
          <ul className="entity-list">
            {items.map((item) => (
              <li className="entity-row" key={item.item_id}>
                <div className="entity-row-main">
                  <span>{item.name}</span>
                  {item.value != null && <span className="entity-row-meta">{item.value}gp</span>}
                </div>
              </li>
            ))}
            {items.length === 0 && <li className="entity-empty">No items yet.</li>}
          </ul>
          <form className="inline-form" onSubmit={handleCreateItem}>
            <input placeholder="Item name" type="text" value={itemName} onChange={(event) => setItemName(event.target.value)} />
            <input placeholder="Value" type="number" step="0.01" value={itemValue} onChange={(event) => setItemValue(event.target.value)} />
            <button type="submit">Add Item</button>
          </form>
        </>
      )}
    </section>
  );
}

export default ShopsSection;
