<template>
  <div class="archivePage storiesPage">
    <header class="archiveHeader">
      <h1>Character Stories</h1>
      <nav class="archiveNav">
        <router-link class="archiveButton" to="/">Back to the Map</router-link>
        <router-link class="archiveButton" to="/items"
          >Item Tracker</router-link
        >
      </nav>
    </header>

    <div class="storyLayout">
      <aside class="fighterPicker archivePanel">
        <input
          class="search"
          type="search"
          v-model="search"
          placeholder="Search fighters..."
          aria-label="Search fighters"
        />
        <div class="pickerFilters">
          <label
            ><input type="radio" value="all" v-model="factionFilter" />
            All</label
          >
          <label
            ><input type="radio" value="pyre" v-model="factionFilter" />
            Pyre</label
          >
          <label
            ><input type="radio" value="bastion" v-model="factionFilter" />
            Bastion</label
          >
        </div>
        <div class="pickerCount">{{ filteredFighters.length }} fighters</div>
        <ul class="pickerList">
          <li
            v-for="f in filteredFighters"
            :key="f.id"
            :class="[f.faction, { active: f.id === fighterId }]"
            @click="selectFighter(f.id)"
          >
            <span class="pickerName">{{ f.name }}</span>
            <span class="pickerRounds" :title="`${f.rounds} rounds fought`">{{
              f.rounds
            }}</span>
          </li>
        </ul>
      </aside>

      <main class="storyPane">
        <div v-if="!fighter" class="emptyPrompt archivePanel">
          <h2>Every fighter has a story</h2>
          <p>
            Pick a fighter from the list to follow them through the War for
            Rayuba: every battle they fought, who they fought, where, and the
            comics that tell it, in order.
          </p>
          <p>
            Results are hidden until you choose to see them, so you can read
            along without spoilers.
          </p>
        </div>

        <template v-else>
          <section class="storyHeader archivePanel">
            <ProfilePic
              class="storyPortrait"
              :class="currentFaction"
              :imgUrl="`fighterimages/${fighter.id}.png`"
              :faction="currentFaction"
              :zoom_start="
                fighter.profilePic ? parseFloat(fighter.profilePic.zoom) : 1
              "
              :left_start="
                fighter.profilePic ? parseFloat(fighter.profilePic.left) : 50
              "
              :top_start="
                fighter.profilePic ? parseFloat(fighter.profilePic.top) : 50
              "
            />
            <div class="storyTitle">
              <h2>{{ fighter.name }}</h2>
              <div class="factionJourney">
                <span
                  v-for="(faction, i) in factionJourney"
                  :key="`${faction}-${i}`"
                >
                  <span class="factionTag" :class="faction">{{ faction }}</span
                  ><span v-if="i < factionJourney.length - 1"> → </span>
                </span>
              </div>
              <div class="artists">
                <div v-for="artist in artists" :key="artist.name">
                  <b>{{ artist.role }}:</b> {{ artist.name }}
                </div>
              </div>
              <div class="stats">
                <span>{{ story.length }} rounds</span>
                <span>·</span>
                <span>{{ readCount }} of {{ comicCount }} comics read</span>
                <span v-if="revealAll">·</span>
                <span v-if="revealAll">{{ record }}</span>
              </div>
              <div class="progressBar" v-if="comicCount > 0">
                <div
                  class="progressFill"
                  :style="{ width: `${(100 * readCount) / comicCount}%` }"
                ></div>
              </div>
              <label class="revealToggle">
                <input type="checkbox" v-model="revealAll" />
                Show all results (spoilers!)
              </label>
            </div>
          </section>

          <section class="backstory archivePanel" v-if="hasBackstory">
            <h3>Backstory</h3>
            <div class="backstoryText">{{ backstory }}</div>
          </section>

          <ol class="timeline">
            <StoryEntry
              v-for="(entry, i) in story"
              :key="`${fighter.id}-${entry.round}`"
              :entry="entry"
              :fighterId="fighter.id"
              :previousFaction="i > 0 ? story[i - 1].faction : undefined"
              :revealAll="revealAll"
            />
          </ol>
        </template>
      </main>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex"
import {
  FIGHTER_GETTER,
  FIGHTER_STORY,
  STORY_FIGHTER_LIST,
  FIGHTER_BACKSTORY
} from "../state/getters"
import { isNotALink } from "../common/links"
import { ensureReadingList, storyRoute } from "../common/navigation"
import ProfilePic from "../components/elements/ProfilePic.vue"
import StoryEntry from "../components/Story/StoryEntry.vue"
import "./archivePage.css"

export default {
  name: "CharacterStories",
  components: {
    ProfilePic,
    StoryEntry
  },
  data: function() {
    return {
      search: "",
      factionFilter: "all",
      revealAll: false
    }
  },
  beforeMount: function() {
    ensureReadingList(this.$store)
  },
  computed: {
    fighterId: function() {
      var id = parseInt(this.$route.query.fighter)
      return isNaN(id) ? null : id
    },
    fighter: function() {
      if (this.fighterId === null) return null
      return this.fighterGet(this.fighterId) || null
    },
    story: function() {
      return this.fighter ? this.fighterStory(this.fighter.id) : []
    },
    currentFaction: function() {
      if (this.story.length === 0) return ""
      return this.story[this.story.length - 1].faction
    },
    factionJourney: function() {
      return this.story
        .map(e => e.faction)
        .filter((f, i, all) => i === 0 || all[i - 1] !== f)
    },
    artists: function() {
      return this.fighter ? Object.values(this.fighter.artists || {}) : []
    },
    hasBackstory: function() {
      return this.fighter && `${this.fighter.id}` in this.backstories
    },
    backstory: function() {
      return this.fighterBackstory(this.fighter.id)
    },
    comics: function() {
      return this.story.filter(e => !isNotALink(e.link))
    },
    comicCount: function() {
      return this.comics.length
    },
    readCount: function() {
      var read = this.readingList[this.fighter.id] || []
      return this.comics.filter(e => read.includes(e.round)).length
    },
    record: function() {
      var wins = this.story.filter(e => e.outcome === "win").length
      var losses = this.story.filter(e => e.outcome === "lose").length
      return `${wins} won, ${losses} lost`
    },
    filteredFighters: function() {
      var term = this.search.trim().toLowerCase()
      return this.fighterList.filter(f => {
        if (this.factionFilter !== "all" && f.faction !== this.factionFilter)
          return false
        return term === "" || f.name.toLowerCase().includes(term)
      })
    },
    ...mapState(["readingList", "backstories"]),
    ...mapGetters({
      fighterGet: FIGHTER_GETTER,
      fighterStory: FIGHTER_STORY,
      fighterList: STORY_FIGHTER_LIST,
      fighterBackstory: FIGHTER_BACKSTORY
    })
  },
  watch: {
    fighterId: function() {
      this.revealAll = false
      var pane = this.$el
      if (pane) pane.scrollTop = 0
    }
  },
  methods: {
    selectFighter: function(id) {
      if (id === this.fighterId) return
      this.$router.push(storyRoute(id))
    }
  }
}
</script>

<style scoped>
.storyLayout {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1em;
  max-width: 1200px;
  margin: 1em auto 0 auto;
}

.fighterPicker {
  position: sticky;
  top: 1em;
  flex: 0 0 18em;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 7em);
  padding: 0.6em;
}

.search {
  width: 100%;
  padding: 0.4em 0.6em;
  font-size: 1em;
  border-radius: 0.3em;
  border: 2px solid rgb(189, 136, 58);
  background-color: #3e112b;
  color: #ffd27a;
}

.search::placeholder {
  color: rgba(242, 169, 29, 0.6);
}

.pickerFilters {
  display: flex;
  justify-content: space-between;
  margin: 0.5em 0.2em 0.2em 0.2em;
  font-size: 0.9em;
}

.pickerFilters label {
  cursor: pointer;
}

.pickerCount {
  font-size: 0.8em;
  opacity: 0.8;
  margin: 0.2em;
}

.pickerList {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1 1 auto;
}

.pickerList li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4em;
  padding: 0.3em 0.5em;
  border-left: 4px solid transparent;
  cursor: pointer;
  line-height: 1.2;
}

.pickerList li.pyre {
  border-left-color: rgb(214, 90, 30);
}

.pickerList li.bastion {
  border-left-color: rgb(60, 120, 200);
}

.pickerList li:hover {
  background-color: rgba(0, 0, 0, 0.25);
}

.pickerList li.active {
  background-color: rgb(97, 69, 17);
  color: #fff3d6;
}

.pickerName {
  overflow: hidden;
  text-overflow: ellipsis;
}

.pickerRounds {
  flex: 0 0 auto;
  font-size: 0.75em;
  padding: 0 0.4em;
  border-radius: 1em;
  background-color: rgba(0, 0, 0, 0.3);
}

.storyPane {
  flex: 1 1 auto;
  min-width: 0;
}

.emptyPrompt {
  padding: 1.5em;
  line-height: 1.5;
}

.emptyPrompt h2 {
  font-family: "Suez One", serif;
  font-weight: normal;
  margin-top: 0;
  color: #e37e30;
}

.storyHeader {
  display: flex;
  flex-direction: row;
  gap: 1.2em;
  padding: 1em;
}

.storyPortrait {
  flex: 0 0 auto;
  position: relative;
  overflow: hidden;
  width: 9em;
  height: 9em;
  border: 4px solid #9c031f;
  border-radius: 0.4em;
}

.storyPortrait.pyre {
  border-color: rgb(214, 90, 30);
}

.storyPortrait.bastion {
  border-color: rgb(60, 120, 200);
}

.storyTitle {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35em;
}

.storyTitle h2 {
  font-family: "Saira", sans-serif;
  font-size: 2em;
  line-height: 1.05;
  margin: 0;
  color: #ffd27a;
}

.artists {
  font-size: 0.9em;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
  font-size: 0.9em;
}

.progressBar {
  height: 0.5em;
  border-radius: 0.25em;
  background-color: rgba(0, 0, 0, 0.35);
  overflow: hidden;
  max-width: 20em;
}

.progressFill {
  height: 100%;
  background-color: rgb(140, 210, 60);
  transition: width 0.4s;
}

.backstory {
  margin-top: 1em;
  padding: 0.8em 1em;
}

.backstory h3 {
  font-family: "Suez One", serif;
  font-weight: normal;
  margin: 0 0 0.4em 0;
  color: #e37e30;
}

.backstoryText {
  white-space: pre-wrap;
  line-height: 1.45;
  max-height: 16em;
  overflow-y: auto;
}

.timeline {
  margin: 1.2em 0 0 0;
  padding: 0;
}

@media only screen and (max-width: 840px) {
  .storyLayout {
    flex-direction: column;
    align-items: stretch;
  }

  .fighterPicker {
    position: static;
    flex-basis: auto;
    max-height: 40vh;
  }

  .storyHeader {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stats,
  .factionJourney {
    justify-content: center;
  }

  .progressBar {
    width: 100%;
  }
}
</style>
