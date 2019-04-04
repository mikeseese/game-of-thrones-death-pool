<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>Your Truffle Box is installed and ready.</p>
    <h2>Smart Contract Example</h2>
    <p>
        If your contracts compiled and migrated successfully, below will show
        a stored value of 5 (by default).
    </p>
    <p>
        Try changing the value stored on <strong>line 37</strong> of App.js.
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class HelloWorld extends Vue {
  @Prop() private msg!: string;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
