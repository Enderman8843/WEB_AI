<script setup>
import history_element from './components/history_element.vue'
import chat_element from './components/chat_element.vue'
import 'material-icons/iconfont/material-icons.css'
import sys from './components/sys_stats.vue'
import { ref, onMounted, watch } from 'vue'
import progress_bar from './components/progress_bar.vue'
import { useRoute } from 'vue-router'

const input = ref('')
const messages = ref([])
const loading = ref(true)
const selectedModel = ref('')
const progress = ref(0)
const isStreaming = ref(false)
const error = ref(null)
const historyList = ref([])
const currentChatId = ref(null)
const showSystemPopup = ref(false)
const container = ref(null)
const route = useRoute()
const modelList =  ref([

  'HuggingFaceTB/SmolLM2-360M-Instruct',
    'HuggingFaceTB/SmolLM3-3B',
'Xenova/distilgpt2',
'onnx-community/Llama-3.2-3B-Instruct',
  'HuggingFaceTB/SmolLM2-1.7B-Instruct',
  'HuggingFaceTB/SmolLM2-360M-Instruct',
 
  'onnx-community/Llama-3.2-1B-Instruct',
 
 
  'HuggingFaceTB/SmolLM3-3B'
])


// ▒█▀▀█ ▒█▀▀▀█ ▒█▀▀▄ ▒█▀▀▀ ▒█▀▀▄ 　 ▒█▀▀█ ▒█░░▒█ 
// ▒█░░░ ▒█░░▒█ ▒█░▒█ ▒█▀▀▀ ▒█░▒█ 　 ▒█▀▀▄ ▒█▄▄▄█ 
// ▒█▄▄█ ▒█▄▄▄█ ▒█▄▄▀ ▒█▄▄▄ ▒█▄▄▀ 　 ▒█▄▄█ ░░▒█░░

// ███████╗███╗░░██╗██████╗░██╗███╗░░██╗██╗░░░██╗░█████╗░██╗██████╗░
// ██╔════╝████╗░██║██╔══██╗██║████╗░██║██║░░░██║██╔══██╗██║██╔══██╗
// █████╗░░██╔██╗██║██║░░██║██║██╔██╗██║╚██╗░██╔╝██║░░██║██║██║░░██║
// ██╔══╝░░██║╚████║██║░░██║██║██║╚████║░╚████╔╝░██║░░██║██║██║░░██║
// ███████╗██║░╚███║██████╔╝██║██║░╚███║░░╚██╔╝░░╚█████╔╝██║██████╔╝
// ╚══════╝╚═╝░░╚══╝╚═════╝░╚═╝╚═╝░░╚══╝░░░╚═╝░░░░╚════╝░╚═╝╚═════╝░


function saveChatHistory() {
  if (!messages.value.length) return
  const id = currentChatId.value || Date.now().toString()
  const title = messages.value.find(m => m.person === 'User')?.personi?.slice(0, 30) || "New Chat"
  const date = new Date().toLocaleString()
  const chat = { id, title, date, messages: JSON.parse(JSON.stringify(messages.value)) }
  const idx = historyList.value.findIndex(c => c.id === id)
  if (idx !== -1) historyList.value[idx] = chat
  else historyList.value.push(chat)
  localStorage.setItem("chatHistory", JSON.stringify(historyList.value))
  currentChatId.value = id
}

function loadHistory() {
  const saved = localStorage.getItem("chatHistory")
  if (saved) historyList.value = JSON.parse(saved)
}

function openHistoryChat(id) {
  const chat = historyList.value.find(c => c.id === id)
  if (chat) {
    messages.value = JSON.parse(JSON.stringify(chat.messages))
    currentChatId.value = chat.id
  }
}

function deleteHistoryChat(id) {
  historyList.value = historyList.value.filter(c => c.id !== id)
  localStorage.setItem("chatHistory", JSON.stringify(historyList.value))
  if (currentChatId.value === id) {
    messages.value = []
    currentChatId.value = null
  }
}


let worker = null

onMounted(() => {
  loadHistory()
  selectedModel.value = route.query.model || modelList.value[0]

  worker = new Worker(new URL('../worker.js', import.meta.url), { type: 'module' })

  worker.onmessage = (e) => {
    const msg = e.data
    if (msg.type === 'progress') progress.value = msg.progress
    if (msg.type === 'token') {
      messages.value[messages.value.length - 1].personi = msg.full
    
    }
    if (msg.type === 'done') {
      isStreaming.value = false
      saveChatHistory()
    }
    if (msg.type === 'error') {
      isStreaming.value = false
      messages.value[messages.value.length - 1].personi = `(error: ${msg.message})`
    }
    if (msg.type === 'ready') {
      loading.value = false
    }
  }


  worker.postMessage({ type: 'init', data: { model: selectedModel.value } })
})

function sendmsg() {
  const text = input.value.trim()
  if (!text || isStreaming.value) return

  messages.value.push({ person: 'User', personi: text })
  messages.value.push({ person: 'Assistant', personi: '' })
  input.value = ''
  isStreaming.value = true

  worker.postMessage({ type: 'generate', data: { text } })
}

watch(selectedModel, (newModel) => {
  loading.value = true
  worker.postMessage({ type: 'init', data: { model: newModel } })
})
</script>


<template>
  <header
    style="display:flex; flex-direction: row; border-radius: 13px; border-width: 2px; border-color: white; border-style: solid; color: white; padding:0.5rem;"
  >
    <a style="font-family:Noto Sans, sans-serif; font-weight:600; font-size: larger; margin:0.2rem">Lanthanum.AI</a>
   
    <div style="width:95%; display:flex; justify-content:flex-end;">
   
 
    <span @click="shareChat" class="material-icons">ios_share</span>
    <span @click="toggleSystemInfo" class="material-icons" style="cursor:pointer; margin:0.2rem;">
      memory
    </span>
</div>

  </header>

  <div v-if="showSystemPopup" class="overlay">
  <sys></sys>
</div>
<div v-if="loading || error" class="overlay">
  <div class="card" style="width:30vw; background-color:#242424; text-align:center; padding:1rem;">
    <template v-if="loading && !error">
      <h3 style="color:white;">Loading Model...</h3>

      <progress_bar :progress=progress />


      <p style="color:white;">{{ progress }}%</p>
      <p style="color:gray; font-size:0.9rem;">This may take up to 1–2 minutes</p>
    </template>

    <template v-else-if="error">
    <div>
      <div style="background-color:  #6b6767;; ; padding:1rem; border-radius:10px;
                max-height:150px; overflow-y:auto; font-size:0.9rem;">
                
    <p style="font-family: consolas;">Error Occured: {{ error }}</p>
    </div>
    
    <p style="font-size:small; font-family: consolas;">Note : This program has been tested in various machine and has no error , If you are facing error it must be due to hardware limitation prefer the cpu option</p>
    <router-link to="/cpu">
    <button 
       
        style="margin-top:8px; padding:6px 12px; border:none; border-radius:6px; background:#333; color:white; cursor:pointer;">
        Use CPU
      </button>
      </router-link>
        </div>
    </template>

  

  </div>
</div>




  <div class="main" >
    
    <div class="his_card" style="overflow-x: scroll; scrollbar-width: none; margin-right: 10px;">
      <button class="model-select" @click="newChat" style="margin:10px;  padding:0.5rem;">Add new Chat</button>
         <div style="margin:10px; width:100%; height:10%;  padding:0.5rem;" class=""> 
          <a>Select Model : </a> 
          <div style="height:10px"></div>
          <select
          class="model-select"
           v-model="selectedModel" 
           :disabled="loading || isStreaming"
           @change="newModel(selectedModel)">

    <option v-for="m in modelList" :key="m" :value="m">{{m}}</option>
  </select></div>
         <div style="background-color:white; height:1px"></div>
         <div v-for="chat in historyList" :key="chat.id" style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem; cursor:pointer;">
  <div @click="openHistoryChat(chat.id)">
    <history_element :Heading="chat.title" Subject="Saved Chat" :chatId="chat.id" @delete="deleteHistoryChat"  />
  </div>
  
</div>
    </div>

  
    <div style="display: flex; flex-direction: column; flex: 1;">
      <div class="card"
           style="width: auto; height: 70vh; scrollbar-width: none; overflow-y: scroll; padding: 1rem;">
        <chat_element
          v-for="(msg, index) in messages"
          :key="index"
          :person="msg.person"
          :personi="msg.personi"
        />
      </div>

      <div class="input_card"
           style="display: flex; flex-direction: row; align-items: center; gap: 0.5rem;">
        <input
          v-model="input"
          @keyup.enter="sendmsg"
          placeholder="Enter the message!"
          class="input"
          style="flex: 1; padding: 0.25rem;"
          :disabled="loading || isStreaming"
        />
<button 
  @click="() => isStreaming ? engine?.interruptGenerate?.() : sendmsg()" 
  :disabled="loading"
  style="border: none; background-color: #242424; color: white; padding: 0.2rem; display:flex; align-items:center; justify-content:center;"
>
  <span 
    v-if="isStreaming" 
    class="material-icons spin"
  >
    autorenew
  </span>
  <span 
    v-else 
    class="material-icons"
  >
    arrow_forward_ios
  </span>
</button>


      </div>
    </div>
  </div>

</template>
