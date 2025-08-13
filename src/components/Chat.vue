<script setup>
defineProps({
  replier:String,
  content: String,
})





</script>

<template>
  <div class="card" style="width:80%; display:'flex'; flex-direction:row'">
    <a>{{replier}}</a>
    <a>{{content}}</a>

  </div>
</template>