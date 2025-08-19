<script setup>
defineProps({
  Heading: String,
  Subject: String,
})


</script>

<template>
  <div class="card"  style="margin:10px; width:80%; height:10%;  padding:1rem;">
    {{Heading}}
    {{ Subject }}

  </div>
</template>