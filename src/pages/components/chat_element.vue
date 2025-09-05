<script setup>
defineProps({
  personi: String,
  person: String,
})


</script>

<template>
  <div class="card" style="display:flex; flex-direction:column;">
   <a style="font-size: 20px; font-weight: 600;">
      {{ person }}
   </a> 
    <a style="font-size: 13px; margin: 2px 0 0; ">
      {{ personi }}
    </a>
    

  </div>
</template>