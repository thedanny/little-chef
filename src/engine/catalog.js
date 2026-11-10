// Everything coins can buy: recipes, chef outfits, pets and kitchen decorations.

import { BASE_RECIPES } from './recipes.js';

export const CATALOG = [
  // New recipes (some bring a new station with them).
  { id: 'soup', kind: 'recipe', price: 60 },
  { id: 'grilled', kind: 'recipe', price: 60 },
  { id: 'fries', kind: 'recipe', price: 120 },
  { id: 'cookies', kind: 'recipe', price: 150 },
  // Chef outfits (one worn at a time).
  { id: 'classic', kind: 'outfit', price: 0 },
  { id: 'bandana', kind: 'outfit', price: 40 },
  { id: 'bunny', kind: 'outfit', price: 60 },
  { id: 'crown', kind: 'outfit', price: 80 },
  { id: 'wizard', kind: 'outfit', price: 90 },
  { id: 'space', kind: 'outfit', price: 120 },
  // Pets (one out at a time).
  { id: 'cat', kind: 'pet', price: 80 },
  { id: 'dog', kind: 'pet', price: 80 },
  { id: 'rabbit', kind: 'pet', price: 100 },
  { id: 'parrot', kind: 'pet', price: 120 },
  { id: 'dragon', kind: 'pet', price: 200 },
  // Wall colours (one at a time).
  { id: 'sunny', kind: 'wall', price: 0 },
  { id: 'mint', kind: 'wall', price: 30 },
  { id: 'berry', kind: 'wall', price: 30 },
  { id: 'sky', kind: 'wall', price: 50 },
  { id: 'night', kind: 'wall', price: 60 },
  // Decorations (any number at once).
  { id: 'plant', kind: 'decor', price: 20 },
  { id: 'picture', kind: 'decor', price: 25 },
  { id: 'bunting', kind: 'decor', price: 30 },
  { id: 'fishbowl', kind: 'decor', price: 40 },
  { id: 'lights', kind: 'decor', price: 45 },
];

export const SHOP_TABS = ['recipe', 'outfit', 'pet', 'wall', 'decor'];

const BY_ID = new Map(CATALOG.map((i) => [i.id, i]));

export function item(id) {
  return BY_ID.get(id) || null;
}

export function itemsOfKind(kind) {
  return CATALOG.filter((i) => i.kind === kind);
}

export function defaultOwned() {
  return [...BASE_RECIPES, 'classic', 'sunny'];
}

export function owns(profile, id) {
  return profile.owned.includes(id);
}

export function isEquipped(profile, id) {
  const it = item(id);
  if (!it) return false;
  switch (it.kind) {
    case 'recipe': return owns(profile, id);
    case 'outfit': return profile.equipped.outfit === id;
    case 'pet': return profile.equipped.pet === id;
    case 'wall': return profile.equipped.wall === id;
    case 'decor': return profile.equipped.decor.includes(id);
    default: return false;
  }
}

/** Buy an item. Returns true when the purchase happened. */
export function buy(profile, id) {
  const it = item(id);
  if (!it || owns(profile, id) || profile.coins < it.price) return false;
  profile.coins -= it.price;
  profile.owned.push(id);
  equip(profile, id, true);
  return true;
}

/** Put on / take off an owned item. Returns the new equipped state. */
export function equip(profile, id, on = !isEquipped(profile, id)) {
  const it = item(id);
  if (!it || !owns(profile, id)) return false;
  switch (it.kind) {
    case 'outfit':
      profile.equipped.outfit = on ? id : 'classic';
      break;
    case 'pet':
      profile.equipped.pet = on ? id : null;
      break;
    case 'wall':
      profile.equipped.wall = on ? id : 'sunny';
      break;
    case 'decor': {
      const set = new Set(profile.equipped.decor);
      if (on) set.add(id); else set.delete(id);
      profile.equipped.decor = [...set];
      break;
    }
    default:
      return true; // recipes are always active once owned
  }
  return isEquipped(profile, id);
}

export function unlockedRecipes(profile) {
  return profile.owned.filter((id) => item(id)?.kind === 'recipe' || BASE_RECIPES.includes(id));
}
