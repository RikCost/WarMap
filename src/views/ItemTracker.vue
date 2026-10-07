<template>
  <div class="archivePage itemsPage">
    <header class="archiveHeader">
      <h1>Battle Item Tracker</h1>
      <nav class="archiveNav">
        <router-link class="archiveButton" to="/">Back to the Map</router-link>
        <router-link class="archiveButton" to="/stories"
          >Character Stories</router-link
        >
      </nav>
    </header>

    <div class="archiveIntro">
      <p>
        Relics of terrible power were scattered across Rayuba. This is every
        battle each of them showed up in, round by round. Who actually carried
        an item isn't always on record, so the fighters of both sides are listed
        and the battle notes tell the rest.
      </p>
      <div class="controls">
        <label>
          As of
          <select v-model.number="asOfRound">
            <option v-for="r in roundOptions" :key="r" :value="r">
              Round {{ r }}
            </option>
          </select>
        </label>
        <label class="revealToggle">
          <input type="checkbox" v-model="revealAll" />
          Show all results (spoilers!)
        </label>
      </div>
    </div>

    <div class="itemGrid">
      <section
        v-for="item in itemCards"
        :key="item.id"
        :id="`item-${item.id}`"
        class="itemCard archivePanel"
        :class="{ highlighted: item.id === focusedItem }"
      >
        <div class="itemHeader">
          <img
            class="itemImage"
            :src="`items/${item.id}.png`"
            alt=""
            draggable="false"
          />
          <div>
            <h2>{{ item.name }}</h2>
            <div class="itemDescription">{{ item.description }}</div>
          </div>
        </div>

        <details class="rules">
          <summary>Rules</summary>
          <div class="rulesText">{{ item.rules }}</div>
        </details>

        <div class="status">
          <template v-if="!item.inPlay">
            <span class="statusLabel dormant">Not yet in play</span>
            <span v-if="item.starting_round">
              — enters the war in round {{ item.starting_round }}</span
            >
          </template>
          <template v-else-if="item.lastSeen">
            <span class="statusLabel">Last seen</span>
            round {{ item.lastSeen.round }} at
            <button
              class="tileLink"
              v-for="tile in item.lastSeen.locations"
              :key="tile"
              @click="toMap(item.lastSeen.round, tile)"
              title="Show on the map"
            >
              {{ tile.toUpperCase() }}
            </button>
            <span v-if="item.lastSeen.zoneName">
              ({{ item.lastSeen.zoneName }})</span
            >
          </template>
          <template v-else>
            <span class="statusLabel">In play</span> since round
            {{ item.starting_round }}, not yet seen in battle
          </template>
        </div>

        <div class="battleLog" v-if="item.battles.length > 0">
          <h3>
            {{ item.battles.length }}
            {{ item.battles.length === 1 ? "battle" : "battles" }}
          </h3>
          <ol>
            <li
              v-for="battle in item.battles"
              :key="`${battle.round}-${battle.locations[0]}`"
              class="battle"
            >
              <div class="battleTitle">
                <span class="battleRound">Round {{ battle.round }}</span>
                {{ kindLabel(battle.kind) }}
                <button
                  class="tileLink"
                  v-for="tile in battle.locations"
                  :key="tile"
                  @click="toMap(battle.round, tile)"
                  title="Show on the map"
                >
                  {{ tile.toUpperCase() }}
                </button>
              </div>
              <div class="sides">
                <div
                  class="side"
                  v-for="faction in ['pyre', 'bastion']"
                  :key="faction"
                >
                  <span class="factionTag" :class="faction">{{ faction }}</span>
                  <span
                    v-if="battle.fighters[faction].length > maxNames"
                    class="crowd"
                  >
                    {{ battle.fighters[faction].length }} fighters
                  </span>
                  <span v-else>
                    <span
                      v-for="(id, i) in battle.fighters[faction]"
                      :key="`${id}-${i}`"
                    >
                      <FighterLink :fighterId="id" :faction="faction" /><span
                        v-if="i < battle.fighters[faction].length - 1"
                        >,
                      </span>
                    </span>
                  </span>
                </div>
              </div>
              <div
                class="spoilerBlock"
                :class="{ revealed: isRevealed(item.id, battle) }"
                v-if="winner(battle) || battle.note"
                @click="reveal(item.id, battle)"
              >
                <template v-if="!isRevealed(item.id, battle)"
                  >Show result</template
                >
                <template v-else>
                  <span v-if="winner(battle)" class="winner">
                    {{ winner(battle) }} victory</span
                  >
                  <span v-if="battle.note">
                    <span v-if="winner(battle)"> — </span>{{ battle.note }}
                  </span>
                </template>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import {
  ALL_ITEM_IDS,
  ITEM_INFO,
  ITEM_HISTORY,
  ITEM_LAST_SEEN,
  NUMBER_OF_ROUNDS,
  CURRENT_ROUND
} from "../state/getters"
import FighterLink from "../components/elements/FighterLink.vue"
import {
  goToTile,
  ensureReadingList,
  battleKindLabel,
  battleWinner
} from "../common/navigation"
import "./archivePage.css"

export default {
  name: "ItemTracker",
  components: {
    FighterLink
  },
  data: function() {
    return {
      asOfRound: 0,
      revealAll: false,
      revealed: [],
      maxNames: 6
    }
  },
  beforeMount: function() {
    ensureReadingList(this.$store)
    //follow the map's round, unless that is the empty starting board
    this.asOfRound = this.curRound > 0 ? this.curRound : this.numRounds - 1
  },
  mounted: function() {
    this.scrollToFocused()
  },
  computed: {
    roundOptions: function() {
      return [...Array(this.numRounds).keys()]
    },
    focusedItem: function() {
      var id = parseInt(this.$route.query.item)
      return isNaN(id) ? null : id
    },
    itemCards: function() {
      return this.itemIds.map(id => {
        var info = this.itemInfo(id)
        var battles = this.itemHistory(id).filter(
          b => b.round <= this.asOfRound
        )
        return {
          id,
          ...info,
          inPlay: !info.starting_round || info.starting_round <= this.asOfRound,
          lastSeen: this.itemLastSeen(id, this.asOfRound),
          battles
        }
      })
    },
    ...mapGetters({
      itemIds: ALL_ITEM_IDS,
      itemInfo: ITEM_INFO,
      itemHistory: ITEM_HISTORY,
      itemLastSeen: ITEM_LAST_SEEN,
      numRounds: NUMBER_OF_ROUNDS,
      curRound: CURRENT_ROUND
    })
  },
  watch: {
    focusedItem: function() {
      this.$nextTick(this.scrollToFocused)
    }
  },
  methods: {
    kindLabel: battleKindLabel,
    winner: battleWinner,
    battleKey: function(itemId, battle) {
      return `${itemId}-${battle.round}-${battle.locations[0]}`
    },
    isRevealed: function(itemId, battle) {
      return (
        this.revealAll || this.revealed.includes(this.battleKey(itemId, battle))
      )
    },
    reveal: function(itemId, battle) {
      var key = this.battleKey(itemId, battle)
      if (!this.revealed.includes(key)) this.revealed.push(key)
    },
    toMap: function(round, tile) {
      goToTile(this, round, tile)
    },
    scrollToFocused: function() {
      if (this.focusedItem === null) return
      var card = this.$el.querySelector(`#item-${this.focusedItem}`)
      if (card) card.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }
}
</script>

<style scoped>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6em 1.5em;
}

select {
  font-size: 1em;
  padding: 0.15em 0.3em;
  border-radius: 0.2em;
  border: 2px solid rgb(189, 136, 58);
  background-color: #3e112b;
  color: #ffd27a;
}

.itemGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(22em, 1fr));
  gap: 1em;
  max-width: 1200px;
  margin: 0 auto;
}

.itemCard {
  padding: 0.9em;
  transition: box-shadow 0.4s, border-color 0.4s;
  scroll-margin-top: 1em;
}

.itemCard.highlighted {
  border-color: #ffd27a;
  box-shadow: 0 0 0.8em rgba(255, 210, 122, 0.6);
}

.itemHeader {
  display: flex;
  flex-direction: row;
  gap: 0.8em;
  align-items: flex-start;
}

.itemImage {
  flex: 0 0 auto;
  width: 4.5em;
  height: 4.5em;
  object-fit: contain;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 0.4em;
  padding: 0.2em;
}

.itemHeader h2 {
  font-family: "Saira", sans-serif;
  font-size: 1.4em;
  margin: 0;
  color: #ffd27a;
}

.itemDescription {
  font-style: italic;
  white-space: pre-wrap;
  font-size: 0.9em;
  margin-top: 0.2em;
  line-height: 1.35;
}

.rules {
  margin-top: 0.6em;
}

.rules summary {
  cursor: pointer;
  font-weight: bold;
}

.rulesText {
  white-space: pre-wrap;
  font-family: "Roboto Mono", monospace;
  font-size: 0.8em;
  line-height: 1.4;
  margin-top: 0.4em;
  padding: 0.5em;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 0.3em;
}

.status {
  margin-top: 0.7em;
  padding: 0.4em 0.6em;
  border-radius: 0.3em;
  background-color: rgba(0, 0, 0, 0.25);
}

.statusLabel {
  font-weight: bold;
  color: #ffd27a;
}

.statusLabel.dormant {
  color: #c9a0b5;
}

.battleLog h3 {
  font-family: "Suez One", serif;
  font-weight: normal;
  font-size: 1.05em;
  margin: 0.8em 0 0.3em 0;
  color: #e37e30;
}

.battleLog ol {
  list-style: none;
  margin: 0;
  padding: 0;
}

.battle {
  padding: 0.5em 0;
  border-top: 1px solid rgba(156, 3, 31, 0.6);
}

.battleTitle {
  font-weight: bold;
}

.battleRound {
  color: #ffd27a;
  margin-right: 0.3em;
}

.sides {
  margin: 0.3em 0;
  font-size: 0.9em;
  line-height: 1.6;
}

.crowd {
  font-style: italic;
}

.winner {
  font-weight: bold;
  text-transform: capitalize;
}
</style>
