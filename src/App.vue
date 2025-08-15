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


const selectedModel = "SmolLM2-1.7B-Instruct-q4f16_1-MLC";

const dummy_msg = [
  { person: "User", personi: "This is AI!" },
  { peson: "AI", personi: "This is not AI"}
]

onMounted(async () => {
  try {
    console.log("Intializing AI")
    const initProgressCallback = (report) => {
      ProgressEvent.value =report.progress;
      console.log(`loading: ${report.progress} `)

      engine.value = await webllm.CreateMLCEngine(
        selectedModel,
        { initProgressCallback }
      );

      loading.value = false;
      console.log('sucess')
    }
  }catch (err){
    console.error(err);
  }
}
   
)
</script>

<template>
  <header style="border-radius: 20px; border-width: 30; border-color:white; border-style: solid; color: white; padding: 1rem;">
    <a>WEB - AI</a>
  </header>

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


