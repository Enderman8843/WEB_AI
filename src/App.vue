<script setup>
import Chatbox from './components/Chat.vue';
import history_element from './components/history_element.vue';
import * as webllm from "@mlc-ai/web-llm";
import 'material-icons/iconfont/material-icons.css';
import { ref, onMounted } from "vue";


const input = ref("");
const messages = ref([]);
const engine = ref(null);


const selectedModel = "Llama-3-8B-Instruct-q4f16_1-MLC";

// onMounted(async () => {
//   console.log("Available models:", webllm.prebuiltAppConfig.model_list);
//   engine.value = await webllm.CreateMLCEngine(selectedModel, {
//     progressCallback: (p) => console.log("Loading:", p)
//   });
//   console.log("Model loaded!");
// });

// const sendmsg = async () => {
//   if (!input.value.trim() || !engine.value) return;

//   // Add user message to UI
//   const userMessage = input.value;
//   messages.value.push({ sender: 'User', text: userMessage });
//   input.value = "";

//   try {
//     const reply = await engine.value.chat.completions.create({
//       messages: [{ role: "user", content: userMessage }]
//     });

//     const aiText = reply.choices[0].message.content;
//     messages.value.push({ sender: 'AI', text: aiText });
//   } catch (err) {
//     console.error("Chat error:", err);
//   }
// };
// Dosen't Work
</script>

<template>
  <header style="border-radius: 20px; border-width: 30; border-color:white; border-style: solid; color: white; padding: 1rem;">
    <a>WEB - AI</a>
  </header>

  <div style="display: flex; flex-direction: row;">
    <!-- Sidebar history -->
    <div class="card" style="overflow: scroll; scrollbar-width: none; width: 25vw; margin-right: 10px; height: 80vh">
      <history_element Heading="Random" Subject="Random Chat" />
    </div>

    <!-- Main chat area -->
    <div style="display: flex; flex-direction: column;">
      <!-- Chat messages -->
      <div class="card" style="height: 70vh; width: 75vw; overflow-y: auto; padding: 1rem;">
        <div v-for="(msg, idx) in messages" :key="idx" :style="{ textAlign: msg.sender === 'User' ? 'right' : 'left' }">
          <b>{{ msg.sender }}:</b> {{ msg.text }}
        </div>
      </div>

      <!-- Input bar -->
      <div class="input_card" style="display: flex; flex-direction: row; align-items: center;">
        <input
          v-model="input"
          @keyup.enter="sendmsg"
          placeholder="Enter the message!"
          class="input"
          style="flex: 1; padding: 0.5rem;"
        />
        <button @click="sendmsg" style="border: none; background-color: #242424; color: white; padding: 0.5rem;">
          <span class="material-icons">arrow_forward_ios</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style>
body {
  background-color: #121212;
  font-family: sans-serif;
}

.card {
  background-color: #1e1e1e;
  border-radius: 12px;
  color: white;
}

.input {
  background-color: #2c2c2c;
  border: none;
  color: white;
  border-radius: 8px;
}

.input_card {
  margin-top: 0.5rem;
}
</style>
