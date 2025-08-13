<script setup>
defineProps({
  Heading: String,
  Subject: String,
})


</script>

<template>
  <div class="card" style="width:88%; height:10%">
    {{Heading}}
    {{ Subject }}

  </div>
</template>