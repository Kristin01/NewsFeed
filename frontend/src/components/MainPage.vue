<template>
  <div>
    <a-layout id="components-layout-demo-fixed">
      <a-layout-header :style="{ position: 'fixed', zIndex: 1, width: '100%' }">
        <div :style="{display: 'flex', justifyContent: 'space-between'}">
          <div :style="{ color: 'white', textAlign: 'left', marginLeft: '30px'}">
            <div v-if="user === ''">
              Twitter account is not setup yet. You can bind it by clicking the button on the right
            </div>
            <div v-else>Welcome {{ user }} !</div>
          </div>
          <div :style="{display: 'flex', alignItems: 'center', justifyContent: 'space-around'}">
            <a-button  :style="{marginRight: '10px'}" @click="doRecommend">
              <a-icon type="reload" />
<!--              Refresh-->
            </a-button>
            <a-button >
              <a-icon type="poweroff" />
<!--              Logout-->
            </a-button>
          </div>
        </div>

      </a-layout-header>
      <a-layout-content :style="{ padding: '0 50px', marginTop: '64px' }">
        <div :style="{ background: '#fff', padding: '24px', minHeight: '380px' }">
          <div v-for="article in articles" key="article.link" :style="{marginTop: '20px'}">
            <a-card :title="article.title" :head-style="{textAlign: 'left'}">
              <a slot="extra" :href="article.link">Read More</a>
              <div :style="{ wordWrap: 'break-word'}"><p>{{ article.body.slice(0, 400) }}</p></div>
            </a-card>
          </div>
        </div>
      </a-layout-content>
      <a-layout-footer :style="{ textAlign: 'center' }">
        For Cloud Computing final project
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: "MainPage",
  components: {},
  data() {
    return {
      value: '',
      user: '',
      articles: [
      ]
    }
  },
  async created() {
    // load user
    this.user = localStorage.getItem('user') || ''
    if (this.user !== '') {
      await this.doRecommend()
    }
    // this.doRecommend().then((d)=>{
    //   console.log(d)
    // })
    console.log('Component has been created!');
  },
  methods: {
    async doRecommend() {
      // const resp = await window.fetch('http://ccproj.heliumyc.top:9091/'+this.user,
      const resp = await window.fetch('http://localhost:9091/'+this.user,
          {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Access-Control-Allow-Origin': '*'
            }
          }
      )
      const data = await resp.json()
      for (let x of data) {
        x['link'] = 'http://us.cnn.com'+x['link']
      }
      this.articles = data
      console.log(data)
    }
  }
}
</script>

<style scoped>

</style>