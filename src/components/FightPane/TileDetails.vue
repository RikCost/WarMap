<template>
  <div class="details">
    <h2 class="zoneTitle">
      {{ zoneName }}
    </h2>
    <div class="descText">
      <div class="blockText areaDescription">
        <div
          class="RuleText"
          v-for="entry in specialRuleText"
          :key="entry.name"
        >
          <div class="RuleTitle">{{ entry.name }}</div>
          {{ entry.rule }}
        </div>
        <div class="ItemText" v-for="item in tileItems" :key="item.id">
          <img :src="`items/${item.id}.png`" class="ItemIcon" alt="" />
          <div>
            <div class="RuleTitle">{{ item.name }}</div>
            <div class="ItemDescription">{{ item.description }}</div>
            <router-link class="ItemTrack" :to="item.route"
              >Track this item</router-link
            >
          </div>
        </div>
        {{ zoneDesc }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import {
  CURRENT_ZONE_NAME,
  CURRENT_ZONE_DESC,
  SELECTING_GETTER,
  CURRENT_ZONE_FIGHT,
  CURRENT_ZONE_ITEMS,
  ITEM_INFO
} from "../../state/getters"
import { itemRoute } from "../../common/navigation"

import specials from "../../assets/data/events.json"

export default {
  computed: {
    zoneName: function() {
      return this.currZone(this.selected)
    },
    zoneDesc: function() {
      return this.currZoneDesc(this.selected)
    },
    specialRuleText: function() {
      var ruleset = []
      if (this.zoneFight.events) {
        this.zoneFight.events.forEach(rid => {
          ruleset.push(specials[rid])
        })
      }
      return ruleset
    },
    tileItems: function() {
      return this.zoneItems(this.selected)
        .filter(id => this.itemInfo(id))
        .map(id => {
          return { id, ...this.itemInfo(id), route: itemRoute(id) }
        })
    },
    ...mapGetters({
      currZone: CURRENT_ZONE_NAME,
      currZoneDesc: CURRENT_ZONE_DESC,
      zoneFight: CURRENT_ZONE_FIGHT,
      selected: SELECTING_GETTER,
      zoneItems: CURRENT_ZONE_ITEMS,
      itemInfo: ITEM_INFO
    })
  },
  name: "TileDetails"
}
</script>

<style scoped>
.areaDescription {
  white-space: pre-line;
}

.blockText {
  margin-bottom: 0.9em;
}

.zoneTitle {
  font-family: "Permanent Marker", cursive;
  font-size: 1.5em;
  margin-top: 0.3em;
  margin-bottom: 0.3em;
}

.RuleText {
  font-family: "Roboto Mono", monospace;
  font-size: 0.9em;
  margin: 0.6em;
  line-height: 1.05em;
  border-top-style: solid;
  border-bottom-style: solid;
  padding-top: 0.6em;
  padding-bottom: 0.6em;
}

.ItemText {
  display: flex;
  flex-direction: row;
  gap: 0.6em;
  text-align: left;
  margin: 0.6em;
  padding-bottom: 0.6em;
  border-bottom-style: solid;
}

.ItemIcon {
  width: 3.5em;
  height: 3.5em;
  object-fit: contain;
  flex: 0 0 auto;
}

.ItemText .RuleTitle {
  font-size: 1.3em;
  padding-bottom: 0.2em;
}

.ItemDescription {
  font-style: italic;
  font-size: 0.9em;
}

.ItemTrack {
  display: inline-block;
  margin-top: 0.3em;
  color: #ffd27a;
  font-weight: bold;
}

.RuleTitle {
  font-size: 1.9em;
  padding-bottom: 0.6em;
}

.descText {
  height: 70%;
  overflow-y: auto;
}

.details {
  margin-top: 0.3vh;
  margin-left: auto;
  margin-right: auto;
  order: 2;
  min-width: 20vw;
  width: 98%;
  height: 100%;
  left: 0%;
}
</style>
