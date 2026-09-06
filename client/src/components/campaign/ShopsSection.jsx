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
    <section>
      <h2>Shops</h2>
      {error && <p className="form-error">{error}</p>}

      {isGm && (
        <>
          <form onSubmit={handleCreateShop}>
            <div className="form-field">
              <label htmlFor="shop-name">Name</label>
              <input id="shop-name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="shop-type">Type</label>
              <input id="shop-type" type="text" value={shopType} onChange={(event) => setShopType(event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="shop-city">City</label>
              <select id="shop-city" value={cityId} onChange={(event) => setCityId(event.target.value)}>
                <option value="">(none)</option>
                {cities.map((city) => (
                  <option key={city.city_id} value={city.city_id}>{city.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="shop-owner">Owner NPC</label>
              <select id="shop-owner" value={ownerNpcId} onChange={(event) => setOwnerNpcId(event.target.value)}>
                <option value="">(none)</option>
                {npcs.map((npc) => (
                  <option key={npc.npc_id} value={npc.npc_id}>{npc.name}</option>
                ))}
              </select>
            </div>
            <button className="button button-primary" type="submit">Add Shop</button>
          </form>

          <h3>Item Catalog</h3>
          <form onSubmit={handleCreateItem}>
            <div className="form-field">
              <label htmlFor="item-name">Item name</label>
              <input id="item-name" type="text" value={itemName} onChange={(event) => setItemName(event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="item-value">Value</label>
              <input id="item-value" type="number" step="0.01" value={itemValue} onChange={(event) => setItemValue(event.target.value)} />
            </div>
            <button type="submit">Add Item</button>
          </form>
          <ul>
            {items.map((item) => (
              <li key={item.item_id}>{item.name} {item.value != null && `(${item.value})`}</li>
            ))}
          </ul>
        </>
      )}

      {shops.length === 0 && <p>No shops yet.</p>}

      <ul>
        {shops.map((shop) => (
          <li key={shop.shop_id}>
            <strong>{shop.name}</strong>
            {shop.shop_type && ` - ${shop.shop_type}`}
            {shop.city_id && ` @ ${cityName(shop.city_id) || "?"}`}
            {shop.owner_npc_id && ` (owner: ${npcName(shop.owner_npc_id) || "?"})`}
            {" "}
            <button type="button" onClick={() => toggleInventory(shop.shop_id)}>
              {expandedShopId === shop.shop_id ? "Hide Inventory" : "Show Inventory"}
            </button>
            {isGm && (
              <>
                {" "}
                <label>
                  <input
                    type="checkbox"
                    checked={shop.visible_to_players}
                    onChange={() => toggleVisible(shop)}
                  />
                  Visible to players
                </label>
                {" "}
                <button type="button" onClick={() => handleDeleteShop(shop.shop_id)}>Delete</button>
              </>
            )}

            {expandedShopId === shop.shop_id && (
              <div>
                <ul>
                  {inventory.map((line) => (
                    <li key={line.item_id}>
                      {line.name} - qty {line.quantity}, {line.sell_price != null ? `${line.sell_price}gp` : "no price"}
                      {isGm && (
                        <>
                          {" "}
                          <button type="button" onClick={() => handleRemoveInventory(shop.shop_id, line.item_id)}>Remove</button>
                        </>
                      )}
                    </li>
                  ))}
                  {inventory.length === 0 && <li>Empty.</li>}
                </ul>

                {isGm && (
                  <form onSubmit={(event) => handleAddInventory(event, shop.shop_id)}>
                    <select value={invItemId} onChange={(event) => setInvItemId(event.target.value)}>
                      <option value="">Select item...</option>
                      {items.map((item) => (
                        <option key={item.item_id} value={item.item_id}>{item.name}</option>
                      ))}
                    </select>
                    <input type="number" placeholder="Qty" value={invQuantity} onChange={(event) => setInvQuantity(event.target.value)} />
                    <input type="number" step="0.01" placeholder="Sell price" value={invSellPrice} onChange={(event) => setInvSellPrice(event.target.value)} />
                    <button type="submit">Add to Inventory</button>
                  </form>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ShopsSection;
