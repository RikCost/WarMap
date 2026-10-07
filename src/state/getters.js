const alpahbeticalSort = function(a, b) {
  const theFinder = /the |[",()]/i
  var textA = a.name.toUpperCase().replace(theFinder, "")
  var textB = b.name.toUpperCase().replace(theFinder, "")
  return textA < textB ? -1 : textA > textB ? 1 : 0
}

const isClash = function(tile) {
  if (!("clash" in tile)) {
    return false
  }
  return tile.clash
}

const isMiniClash = function(tile) {
  if (!("miniclash" in tile)) {
    return false
  }
  return tile.miniclash
}

const otherFaction = function(faction) {
  return faction === "pyre" ? "bastion" : "pyre"
}

const battleKind = function(tile) {
  if (tile.grandBattle) return "grandBattle"
  if (isClash(tile)) return "clash"
  if (isMiniClash(tile)) return "miniclash"
  if (tile.contest) return "duel"
  return "other"
}

//all the tiles (but not the round metadata) of a round
const roundTiles = function(state, round) {
  return Object.values(state.roundData[round]).filter(t => "fighters" in t)
}

const zoneNameForTile = function(state, tile) {
  if (tile.gbZone) return tile.gbZone
  var meta = state.metaMap[tile.location]
  if (!meta || !(meta.zone in state.zoneDesc)) return ""
  return state.zoneDesc[meta.zone].name
}

//clashes span multiple tiles that list the same fighters, so they get merged
const summarizeBattle = function(state, round, tiles) {
  var first = tiles[0]
  return {
    round: round,
    locations: tiles.map(t => t.location),
    kind: battleKind(first),
    zoneName: zoneNameForTile(state, first),
    attacker: first.attacker,
    fighters: first.fighters,
    outcome: first.outcome || {},
    note: first.note || first.notes || "",
    items: tiles.reduce(
      (all, t) => all.concat((t.items || []).filter(i => !all.includes(i))),
      []
    ),
    events: first.events || []
  }
}

const sameFighters = function(t1, t2) {
  return (
    JSON.stringify(t1.fighters.pyre) === JSON.stringify(t2.fighters.pyre) &&
    JSON.stringify(t1.fighters.bastion) === JSON.stringify(t2.fighters.bastion)
  )
}

const getters = {
  selecting: state => state.curSelected,
  round: state => state.curRound,
  curRoundBoard: state => state.roundData[state.curRound],
  showingSummary: state => state.showSummary,

  tileState: state => tileName => {
    return state.roundData[state.curRound][tileName]
  },
  tileOwner: state => tileName => {
    return state.roundData[state.curRound][tileName].owner
  },
  numRounds: state => {
    return state.roundData.length
  },
  curZoneId: state => tileName => {
    return state.metaMap[tileName].zone
  },
  curZoneName: state => tileName => {
    return state.zoneDesc[getters.curZoneId(state)(tileName)].name
  },
  showZoneLabel: state => tileName => {
    return "label" in state.metaMap[tileName]
  },
  curZoneDesc: state => tileName => {
    return state.zoneDesc[getters.curZoneId(state)(tileName)].desc
  },
  curZoneContested: state => tileName => {
    if (tileName === "NA") return false
    return state.roundData[state.curRound][tileName].contest
  },
  roundGrandBattles: state => {
    if (!("grandbattle" in state.roundData[state.curRound])) return ["na"]
    return state.roundData[state.curRound].grandbattle.zones
  },
  curZoneAttacker: state => tileName => {
    if (tileName === "NA") return "na"
    const curZoneData = state.roundData[state.curRound][tileName]
    if (!curZoneData.contest && !curZoneData.clash && !curZoneData.miniclash)
      return "na"
    return state.roundData[state.curRound][tileName].attacker
  },
  curZoneGrandBattle: state => tileName => {
    if (tileName === "NA") return false
    return state.roundData[state.curRound][tileName].grandBattle
  },
  curZoneItems: state => tileName => {
    if (tileName === "NA") return []
    if (!("items" in state.roundData[state.curRound][tileName])) return []
    return state.roundData[state.curRound][tileName].items
  },
  massBattleFighters: state => faction => {
    if (state.curSelected === "NA") return []
    var allFighters =
      state.roundData[state.curRound][state.curSelected].fighters[faction]
    //the first fighter is the duelist if it is a mixed tile
    return state.roundData[state.curRound].contest
      ? allFighters.slice(1)
      : allFighters
  },
  curZoneFight: state => {
    if (state.curSelected == "NA")
      return {
        fighters: { pyre: [], bastion: [] },
        contest: false,
        grandBattle: false
      }
    return state.roundData[state.curRound][state.curSelected]
  },
  fighter: state => fighterId => {
    return state.allFighters[fighterId]
  },
  duelistComicCurrent: (state, getters) => faction => {
    var fight = getters.curZoneFight
    if (!fight.contest) return ""
    var fighter = state.allFighters[fight.fighters[faction][0]]
    var subIndex = fighter.rounds.findIndex(i => i == state.curRound)
    return fighter.link[subIndex]
  },
  currentSpoilerRevealed: (state, getters) => {
    var fight = getters.curZoneFight
    if (!(fight.contest || fight.grandBattle || fight.clash || fight.miniclash))
      return false

    return (
      state.revealed[state.curRound].findIndex(i => i === state.curSelected) !==
      -1
    )
  },
  curZoneIsClash: state => {
    //state.roundData[state.curRound][state.curSelected].fighters[faction]
    if (state.curSelected === "NA") return false
    return isClash(state.roundData[state.curRound][state.curSelected])
  },
  tileIsClash: state => tile => {
    return isClash(state.roundData[state.curRound][tile])
  },
  tileIsMiniClash: state => tile => {
    return isMiniClash(state.roundData[state.curRound][tile])
  },
  hasReadFightersComic: state => (fighterId, round) => {
    if (!(`${fighterId}` in state.readingList)) return false
    return state.readingList[fighterId].includes(round)
  },
  fighterBackstory: state => fighterId => {
    if (!(`${fighterId}` in state.backstories)) return "No Backstory Registered"
    return state.backstories[fighterId]
  },
  fighterStory: state => fighterId => {
    var fighter = state.allFighters[fighterId]
    if (!fighter) return []

    return fighter.rounds.map((round, index) => {
      var faction = fighter.faction[index]
      var tiles =
        round < state.roundData.length
          ? roundTiles(state, round).filter(t =>
              (t.fighters[faction] || []).includes(fighter.id)
            )
          : []
      var battle =
        tiles.length > 0 ? summarizeBattle(state, round, tiles) : null
      var enemy = otherFaction(faction)

      return {
        round: round,
        link: fighter.link[index] || "na",
        context: fighter.context[index],
        faction: faction,
        battle: battle,
        allies: battle
          ? battle.fighters[faction].filter(id => id !== fighter.id)
          : [],
        opponents: battle ? battle.fighters[enemy] : [],
        outcome: battle ? battle.outcome[faction] || "" : "",
        attacking: battle ? battle.attacker === faction : false
      }
    })
  },
  storyFighterList: state => {
    return Object.values(state.allFighters)
      .filter(f => f && f.rounds && f.rounds.length > 0)
      .sort(alpahbeticalSort)
      .map(f => {
        return {
          id: f.id,
          name: f.name,
          rounds: f.rounds.length,
          faction: f.faction[f.faction.length - 1]
        }
      })
  },
  itemInfo: state => itemId => {
    return state.items[itemId]
  },
  allItemIds: state => {
    return Object.keys(state.items).map(i => parseInt(i))
  },
  itemHistory: state => itemId => {
    var history = []
    state.roundData.forEach((roundData, round) => {
      var tiles = roundTiles(state, round).filter(t =>
        (t.items || []).includes(itemId)
      )
      //group tiles of the same battle (clashes take up more than one tile)
      var groups = []
      tiles.forEach(t => {
        var group = groups.find(g => sameFighters(g[0], t))
        if (group) group.push(t)
        else groups.push([t])
      })
      groups.forEach(g => history.push(summarizeBattle(state, round, g)))
    })
    return history
  },
  itemLastSeen: (state, getters) => (itemId, round) => {
    var seen = getters.itemHistory(itemId).filter(b => b.round <= round)
    return seen.length > 0 ? seen[seen.length - 1] : null
  },
  showItems: state => {
    return state.showItems
  },
  showLabels: state => {
    return state.showLabels
  },
  showGraphics: state => {
    return state.showGraphics
  },
  getAllFightersThisRoundForFaction: (state, getters) => isBastion => {
    var curRound = getters.round
    var correctFaction = isBastion ? "bastion" : "pyre"
    var currRound = Object.values(state.roundData[curRound]).filter(
      t => !("zones" in t)
    )

    var totalArray = Object.values(state.allFighters).sort((f1, f2) =>
      alpahbeticalSort(f1, f2)
    )
    return totalArray
      .filter(f => {
        var index = f.rounds.findIndex(r => r === curRound)
        if (index == -1) {
          return false
        }

        return f.faction[index] === correctFaction
      })
      .map(f => {
        var index = f.rounds.findIndex(r => r === curRound)

        var testIndex = currRound.findIndex(t =>
          t.fighters[correctFaction].includes(f.id)
        )
        if (testIndex === -1) {
          console.log(`Could not find place for ${f.id}, ${f.name}`)
        }

        return {
          name: f.name,
          id: f.id,
          link: f.link[index],
          tile: currRound[testIndex].location
        }
      })
  }
}

export default getters

const SELECTING_GETTER = "selecting"
const FIGHTER_GETTER = "fighter"
const CURRENT_ROUND = "round"
const TILE_OWNER = "tileOwner"
const CURRENT_ZONE_NAME = "curZoneName"
const CURRENT_ZONE_DESC = "curZoneDesc"
const CURRENT_ZONE_CONTESTED = "curZoneContested"
const CURRENT_ZONE_GRANDBATTLE = "curZoneGrandBattle"
const CURRENT_ZONE_FIGHT = "curZoneFight"
const CURRENT_ZONE_ITEMS = "curZoneItems"
const CUR_FIGHTER_LINK = "duelistComicCurrent"
const CUR_SPOILER_REVEALED = "currentSpoilerRevealed"
const CUR_ZONE_ID = "curZoneId"
const SHOW_ZONE_LABEL = "showZoneLabel"
const NUMBER_OF_ROUNDS = "numRounds"
const CUR_ZONE_ATTACKER = "curZoneAttacker"
const ROUND_GRANDBATTLES = "roundGrandBattles"
const MASSBATTLE_FIGHTERS = "massBattleFighters"
const CURZONE_IS_CLASH = "curZoneIsClash"
const TILE_IS_CLASH = "tileIsClash"
const TILE_IS_MINICLASH = "tileIsMiniClash"
const FIGHTER_BACKSTORY = "fighterBackstory"
const ALL_FIGHTERS_IN_ROUND = "getAllFightersThisRoundForFaction"
const FIGHTER_STORY = "fighterStory"
const STORY_FIGHTER_LIST = "storyFighterList"
const ITEM_INFO = "itemInfo"
const ALL_ITEM_IDS = "allItemIds"
const ITEM_HISTORY = "itemHistory"
const ITEM_LAST_SEEN = "itemLastSeen"

const OPT_SHOW_GRAPHICS = "showGraphics"
const OPT_SHOW_ITEMS = "showItems"
const OPT_SHOW_LABELS = "showLabels"
const OPT_SHOW_SUMMARIES = "showingSummary"

const HAS_READ_COMIC = "hasReadFightersComic"

export {
  SELECTING_GETTER,
  CURRENT_ROUND,
  TILE_OWNER,
  OPT_SHOW_GRAPHICS,
  CURRENT_ZONE_NAME,
  CURRENT_ZONE_DESC,
  CURRENT_ZONE_CONTESTED,
  CURRENT_ZONE_GRANDBATTLE,
  CURRENT_ZONE_FIGHT,
  FIGHTER_GETTER,
  CUR_FIGHTER_LINK,
  CUR_SPOILER_REVEALED,
  CUR_ZONE_ID,
  SHOW_ZONE_LABEL,
  NUMBER_OF_ROUNDS,
  CUR_ZONE_ATTACKER,
  ROUND_GRANDBATTLES,
  MASSBATTLE_FIGHTERS,
  CURZONE_IS_CLASH,
  TILE_IS_CLASH,
  HAS_READ_COMIC,
  FIGHTER_BACKSTORY,
  CURRENT_ZONE_ITEMS,
  OPT_SHOW_ITEMS,
  OPT_SHOW_LABELS,
  ALL_FIGHTERS_IN_ROUND,
  OPT_SHOW_SUMMARIES,
  TILE_IS_MINICLASH,
  FIGHTER_STORY,
  STORY_FIGHTER_LIST,
  ITEM_INFO,
  ALL_ITEM_IDS,
  ITEM_HISTORY,
  ITEM_LAST_SEEN
}
