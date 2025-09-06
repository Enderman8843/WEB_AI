<script>
function toggleSystemInfo() {
  if (showSystemPopup.value) {
    showSystemPopup.value = false
    return
  }

  const mem = navigator.deviceMemory || "N/A"
  const cpu = navigator.hardwareConcurrency || "N/A"
  const webgpu = !!navigator.gpu

  const heapUsed = performance.memory
    ? (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + " MB"
    : "N/A"
  const heapLimit = performance.memory
    ? (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + " MB"
    : "N/A"

  systemInfo.value = {
    ram: mem + " GB",
    cpu,
    heapUsed,
    heapLimit,
    webgpu: webgpu ? "Supported" : " Not Supported"
  }

  showSystemPopup.value = true
}
</script>


<template>

      <div class="card" style="width:30vw; background-color: #242424;">
    <h4 style="margin:8px 0;">System Info</h4>
    <div style="margin:2px;">RAM: {{ systemInfo.ram }}</div>
    <div style="margin:2px;">CPU Cores: {{ systemInfo.cpu }}</div>
    <div style="margin:2px;">Heap Used: {{ systemInfo.heapUsed }}</div>
    <div style="margin:2px;">Heap Limit: {{ systemInfo.heapLimit }}</div>
    <div  :style="systemInfo.webgpu === 'Not supported' ? { color: 'red',fontWeight: 'bold'} : {}"
>WebGPU: {{ systemInfo.webgpu }}</div>
    
    <button
      
      @click="showSystemPopup=false" 
      style="margin-top:8px; padding:6px 12px; border:none; border-radius:6px; background:#333; color:white; cursor:pointer;">
      Close
      </button>
      </div>
</template>