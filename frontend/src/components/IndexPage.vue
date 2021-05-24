<template>
  <div>
    <div class="box">
      <a-input-search
          v-model="value"
          placeholder="Place your twitter ID or homepage here"
          enter-button="Go"
          size="large"
          :style="{marginLeft: '200px'}"
          @search="onSearch"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: "IndexPage",
  data() {
    return {
      value: ''
    }
  },

  methods: {
    onSearch(value) {
      let user = ''
      if (this.isPossibleUrl(value)) {
        user = this.parseInput(value)
        if (!user) {
          user = ''
          this.$message.warn('Invalid homepage url input!');
          return
        }
      } else {
        user = value
      }
      localStorage.setItem('user', user)
      this.$router.push({path: '/recommend'})
    },
    isPossibleUrl(text) {
      const regex = /.*\..*/
      return text.match(regex)
    },
    parseInput(input) {
      // https://twitter.com/scala_lang
      // twitter.com/scala_lang
      const regex = /.*\.com\/(.*)/
      let match = input.match(regex)
      if (match) {
        return match[1]
      } else {
        return null
      }
    },
  },
}
</script>

<style scoped>
.box {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  width: 800px;
  height: 600px;
}
</style>