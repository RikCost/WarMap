<template>
  <li class="storyEntry" :class="entry.faction">
    <div class="roundMarker">
      <span class="roundLabel">Round</span>
      <span class="roundNumber">{{ entry.round }}</span>
    </div>
    <div class="entryBody archivePanel">
      <div class="entryTitle">
        <span class="kind">{{ kindLabel }}</span>
        <span v-if="battle && battle.zoneName"> at {{ battle.zoneName }}</span>
        <button
          class="tileLink"
          v-for="tile in tiles"
          :key="tile"
          @click="toMap(tile)"
          title="Show this battle on the map"
        >
          {{ tile.toUpperCase() }}
        </button>
      </div>

      <div class="entryMeta">
        <span class="factionTag" :class="entry.faction">{{
          entry.faction
        }}</span>
        <span v-if="factionChanged" class="defected">
          (switched sides from {{ previousFaction }})
        </span>
        <span v-if="sideLabel"> · {{ sideLabel }}</span>
      </div>

      <div class="matchup" v-if="isOneOnOne && entry.opponents.length > 0">
        vs
        <span v-for="(id, i) in entry.opponents" :key="`${id}-${i}`">
          <FighterLink :fighterId="id" :faction="enemyFaction" /><span
            v-if="i < entry.opponents.length - 1"
            >,
          </span>
        </span>
      </div>
      <div class="matchup" v-else-if="battle">
        <div v-if="entry.allies.length > 0">
          <details>
            <summary>
              Fought alongside {{ entry.allies.length }}
              {{ entry.allies.length === 1 ? "ally" : "allies" }}
            </summary>
            <div class="nameList">
              <span v-for="(id, i) in entry.allies" :key="`${id}-${i}`">
                <FighterLink :fighterId="id" :faction="entry.faction" /><span
                  v-if="i < entry.allies.length - 1"
                  >,
                </span>
              </span>
            </div>
          </details>
        </div>
        <div v-if="entry.opponents.length > 0">
          <details>
            <summary>
              Against {{ entry.opponents.length }}
              {{ entry.opponents.length === 1 ? "opponent" : "opponents" }}
            </summary>
            <div class="nameList">
              <span v-for="(id, i) in entry.opponents" :key="`${id}-${i}`">
                <FighterLink :fighterId="id" :faction="enemyFaction" /><span
                  v-if="i < entry.opponents.length - 1"
                  >,
                </span>
              </span>
            </div>
          </details>
        </div>
      </div>

      <div class="items" v-if="battle && battle.items.length > 0">
        <router-link
          class="itemChip"
          v-for="itemId in battle.items"
          :key="itemId"
          :to="itemLink(itemId)"
          title="Track this item"
        >
          <img :src="`items/${itemId}.png`" alt="" draggable="false" />
          {{ itemName(itemId) }}
        </router-link>
      </div>

      <div class="entryFooter">
        <div class="comic">
          <span class="comicLabel">Comic:</span>
          <StrikeLink
            :fighterId="fighterId"
            :round="entry.round"
            :inputURL="entry.link"
          />
        </div>
        <div
          class="spoilerBlock outcome"
          :class="{ revealed: isRevealed }"
          v-if="hasResult"
          @click="reveal"
        >
          <template v-if="!isRevealed">Show result</template>
          <template v-else>
            <span class="result" :class="entry.outcome">{{ resultText }}</span>
            <span class="note" v-if="battle.note"> — {{ battle.note }}</span>
          </template>
        </div>
      </div>
    </div>
  </li>
</template>

<script>
import { mapGetters } from "vuex"
import { ITEM_INFO } from "../../state/getters"
import StrikeLink from "../elements/StrikeLink.vue"
import FighterLink from "../elements/FighterLink.vue"
import { goToTile, itemRoute, battleKindLabel } from "../../common/navigation"

export default {
  name: "StoryEntry",
  components: {
    StrikeLink,
    FighterLink
  },
  props: {
    entry: Object,
    fighterId: Number,
    previousFaction: String,
    revealAll: Boolean
  },
  data: function() {
    return {
      revealed: false
    }
  },
  computed: {
    battle: function() {
      return this.entry.battle
    },
    tiles: function() {
      return this.battle ? this.battle.locations : []
    },
    kindLabel: function() {
      return battleKindLabel(this.battle ? this.battle.kind : "")
    },
    isOneOnOne: function() {
      return this.battle && this.battle.kind === "duel"
    },
    enemyFaction: function() {
      return this.entry.faction === "pyre" ? "bastion" : "pyre"
    },
    factionChanged: function() {
      return (
        this.previousFaction !== undefined &&
        this.previousFaction !== this.entry.faction
      )
    },
    sideLabel: function() {
      if (!this.battle || this.battle.kind === "grandBattle") return ""
      if (this.battle.attacker !== "pyre" && this.battle.attacker !== "bastion")
        return ""
      return this.entry.attacking ? "Attacking" : "Defending"
    },
    hasResult: function() {
      return this.entry.outcome === "win" || this.entry.outcome === "lose"
    },
    isRevealed: function() {
      return this.revealAll || this.revealed
    },
    resultText: function() {
      return this.entry.outcome === "win" ? "Victory" : "Defeat"
    },
    ...mapGetters({
      itemInfo: ITEM_INFO
    })
  },
  methods: {
    reveal: function() {
      this.revealed = true
    },
    toMap: function(tile) {
      goToTile(this, this.entry.round, tile)
    },
    itemLink: function(itemId) {
      return itemRoute(itemId)
    },
    itemName: function(itemId) {
      var item = this.itemInfo(itemId)
      return item ? item.name : `Item #${itemId}`
    }
  }
}
</script>

<style scoped>
.storyEntry {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  margin-bottom: 0.9em;
  list-style: none;
}

.roundMarker {
  flex: 0 0 4.2em;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 0.4em;
  position: relative;
}

/* the line connecting the rounds */
.roundMarker::after {
  content: "";
  position: absolute;
  top: 3.6em;
  bottom: -0.9em;
  width: 3px;
  background-color: rgba(156, 3, 31, 0.6);
}

.storyEntry:last-child .roundMarker::after {
  display: none;
}

.roundLabel {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.roundNumber {
  font-family: "Suez One", serif;
  font-size: 1.6em;
  line-height: 1;
  width: 1.6em;
  height: 1.6em;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 3px solid #9c031f;
  background-color: #3e112b;
}

.pyre .roundNumber {
  border-color: rgb(214, 90, 30);
}

.bastion .roundNumber {
  border-color: rgb(60, 120, 200);
}

.entryBody {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.7em 0.9em;
}

.pyre .entryBody {
  border-left: 5px solid rgb(214, 90, 30);
}

.bastion .entryBody {
  border-left: 5px solid rgb(60, 120, 200);
}

.entryTitle {
  font-family: "Saira", sans-serif;
  font-size: 1.2em;
  color: #ffd27a;
}

.kind {
  font-weight: bold;
}

.entryMeta {
  margin-top: 0.2em;
  font-size: 0.9em;
}

.defected {
  color: #ffb3c6;
  font-style: italic;
}

.matchup {
  margin-top: 0.5em;
}

summary {
  cursor: pointer;
}

.nameList {
  margin: 0.3em 0 0.3em 1em;
  line-height: 1.5;
}

.items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
  margin-top: 0.5em;
}

.itemChip {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  padding: 0.1em 0.5em 0.1em 0.2em;
  border: 1px solid rgb(189, 136, 58);
  border-radius: 1em;
  background-color: rgba(0, 0, 0, 0.25);
  color: #ffd27a;
  text-decoration: none;
  font-size: 0.9em;
}

.itemChip:hover {
  background-color: rgba(189, 136, 58, 0.3);
}

.itemChip img {
  width: 1.6em;
  height: 1.6em;
  object-fit: contain;
}

.entryFooter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5em;
  margin-top: 0.6em;
}

.comic {
  display: flex;
  align-items: center;
  gap: 0.4em;
}

.comicLabel {
  font-size: 0.9em;
}

.outcome {
  flex: 0 1 auto;
}

.result {
  font-weight: bold;
}

.result.win {
  color: #9be37a;
}

.result.lose {
  color: #ff8a8a;
}

@media only screen and (max-width: 840px) {
  .roundMarker {
    flex-basis: 3em;
  }

  .roundNumber {
    font-size: 1.2em;
  }

  .roundMarker::after {
    top: 3em;
  }

  .outcome {
    width: 100%;
  }
}
</style>
