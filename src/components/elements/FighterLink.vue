<template>
  <router-link
    class="fighterLink"
    :class="faction"
    :to="route"
    :title="`Read the story of ${name}`"
    >{{ name }}</router-link
  >
</template>

<script>
import { mapGetters } from "vuex"
import { FIGHTER_GETTER } from "../../state/getters"
import { storyRoute } from "../../common/navigation"

export default {
  name: "FighterLink",
  props: {
    fighterId: Number,
    faction: String
  },
  computed: {
    name: function() {
      var fighter = this.fighter(this.fighterId)
      return fighter ? fighter.name : `Fighter #${this.fighterId}`
    },
    route: function() {
      return storyRoute(this.fighterId)
    },
    ...mapGetters({
      fighter: FIGHTER_GETTER
    })
  }
}
</script>

<style scoped>
.fighterLink {
  color: inherit;
  font-weight: bold;
  text-decoration: none;
  border-bottom: 1px dotted currentColor;
}

.fighterLink:hover {
  color: #ffd27a;
  border-bottom-style: solid;
}

.fighterLink.pyre {
  color: #ff9a5a;
}

.fighterLink.bastion {
  color: #8fc7ff;
}
</style>
