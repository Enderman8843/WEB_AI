<script setup>
const props = defineProps({
  Heading: String,
  Subject: String,
  chatId: [String, Number]
})


const emit = defineEmits(['delete'])
</script>

<template>
  <div class="card" style="display:flex; flex-direction: row; align-items:center; justify-content: space-between; margin:0; width:300px ;padding:1rem;">
    <div style="width:100%; display:flex; flex-direction: column;">
      <h2 style="margin:0px">{{ Heading }}</h2>
      <a>{{ Subject }}</a>
    </div>
    <span @click.stop="emit('delete', props.chatId)" class="material-icons" style="cursor:pointer; font-size: 20px;">delete</span>
  </div>
</template>
