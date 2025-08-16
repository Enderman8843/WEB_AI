<script setup>
import Chatbox from './components/Chat.vue';
import history_element from './components/history_element.vue';
import * as webllm from "@mlc-ai/web-llm";
import 'material-icons/iconfont/material-icons.css';
import chat_element from './components/chat_element.vue';
import { ref, onMounted } from "vue";

const input = ref("");
const messages = ref([]);
const engine = ref(null);
const visible = ref(true); // show popup on load
const gpuinfo = ref("Detecting GPU...");
const supported = ref(false);

const selectedModel = "SmolLM2-1.7B-Instruct-q4f16_1-MLC";

const dummy_msg = [
  { person: "User", personi: "This is AI!" },
  { person: "AI", personi: "This is not AI" }
];

function closePopup() {
  visible.value = false;
}

function leaveSite() {
  window.location.href = "https://www.google.com"; // redirect if not supported
}

onMounted(() => {

  const ua = navigator.userAgent;
  const match = ua.match(/Chrom(e|ium)\/([0-9]+)\./);
  const chromeVersion = match ? parseInt(match[2], 10) : 0;


  let gl = document.createElement("canvas").getContext("webgl");
  let debugInfo = gl?.getExtension("WEBGL_debug_renderer_info");
  let renderer = gl?.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL) || "Unknown GPU";


  if (chromeVersion >= 113) {
    gpuinfo.value = `GPU Detected: ${renderer} \nBrowser Version: ${chromeVersion} ✅ Supported`;
    supported.value = true;
  } else {
    gpuinfo.value = `GPU Detected: ${renderer} \nBrowser Version: ${chromeVersion} ❌ Not Supported`;
    supported.value = false;
  }
});
</script>

<template>
  <header style="border-radius: 20px; border-width: 30; border-color:white; border-style: solid; color: white; padding: 1rem;">
    <a>WEB - AI</a>
  </header>

  <div v-if="visible" class="overlay">
    <div v-if="visible" class="popup-content">
      <span class="close" @click="closePopup">&times;</span>
      <h2>GPU CHECK</h2>
      <p>{{ gpuinfo }}</p>

      <div v-if="supported">
        <button @click="closePopup" style="margin-top:10px; padding:8px; background:#242424; color:white; border:none; border-radius:8px;">Continue</button>
      </div>
      <div v-else>
        <button @click="leaveSite" style="margin-top:10px; padding:8px; background:red; color:white; border:none; border-radius:8px;">Leave Site</button>
      </div>
    </div>
  </div>

  <div style="display: flex; flex-direction: row;">
    <div class="card" style="overflow: scroll; scrollbar-width: none; width: 25vw; margin-right: 10px; height: 80vh">
      <history_element Heading="Random" Subject="Random Chat" />
    </div>

    <div style="display: flex; flex-direction: column;">
      <div class="card" style=" width: 75vw; height:70vh; overflow-y: scroll; padding: 1rem;">
        <chat_element
          v-for="(msg, index) in dummy_msg"
          :key="index"
          :person="msg.person"
          :personi="msg.personi"
        />
      </div>

      <div class="input_card" style="display: flex; flex-direction: row; align-items: center;">
        <input
          v-model="input"
          @keyup.enter="sendmsg"
          placeholder="Enter the message!"
          class="input"
          style="flex: 1; padding: 0.25rem;"
        />
        <button @click="sendmsg" style="border: none; background-color: #242424; color: white; padding: 0.5rem;">
          <span class="material-icons">arrow_forward_ios</span>
        </button>
      </div>
    </div>
  </div>
</template>

