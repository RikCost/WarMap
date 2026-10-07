import {
  NEW_SELECTED,
  CHANGE_ROUND,
  LS_AVAILABLE,
  LS_INIT
} from "../state/mutations"
import { storageAvailable } from "./localStorage"

//jump back to the map, with the given round and tile selected
const goToTile = function(component, round, tile) {
  component.$store.commit(CHANGE_ROUND, round)
  component.$store.commit(NEW_SELECTED, tile)
  component.$router.push({ path: "/", query: { round: `${round}`, tile } })
}

const storyRoute = function(fighterId) {
  return { path: "/stories", query: { fighter: `${fighterId}` } }
}

const itemRoute = function(itemId) {
  return { path: "/items", query: { item: `${itemId}` } }
}

//pages other than the map can be landed on directly, so the reading list
//might not be loaded yet
const ensureReadingList = function(store) {
  if (store.state.localStorageAvailable !== null) return
  store.commit(LS_AVAILABLE, storageAvailable("localStorage"))
  store.commit(LS_INIT)
}

const battleKindLabel = function(kind) {
  switch (kind) {
    case "duel":
      return "Duel"
    case "grandBattle":
      return "Grand Battle"
    case "clash":
      return "Clash"
    case "miniclash":
      return "Mini-Clash"
    default:
      return "Battle"
  }
}

const battleWinner = function(battle) {
  if (!battle || !battle.outcome) return ""
  return (
    Object.keys(battle.outcome).find(f => battle.outcome[f] === "win") || ""
  )
}

export {
  goToTile,
  storyRoute,
  itemRoute,
  ensureReadingList,
  battleKindLabel,
  battleWinner
}
