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
const loading = ref()
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

  

  worker.onmessage = (e) => {
  const msg = e.data
  if (msg.type === 'progress') {
    progress.value = msg.progress
  }
  if (msg.type === 'token') {
    messages.value[messages.value.length - 1].personi = msg.full
  }
  if (msg.type === 'done') {
    isStreaming.value = false
    saveChatHistory()
  }
  if (msg.type === 'error') {
    isStreaming.value = false
    error.value = msg.message   
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
   
    <div style="width:95%; display:flex; justify-content:flex-end; gap:0.5rem;">
   
 
      <router-link to="/"><button class="btn-ic" ><span class="material-icons">memory</span>Use GPU</button></router-link>
   <button @click="shareChat" class="btn-ic"><span  class="material-icons">ios_share</span>Share Chat</button> 
   <button @click="toggleSystemInfo" class="btn-ic"><span  class="material-icons">computer</span>Stats</button>
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
    <router-link to="/">
    <button 
       
        style="margin-top:8px; padding:6px 12px; border:none; border-radius:6px; background:#333; color:white; cursor:pointer;">
        Use GPU
      </button>
      </router-link>
        </div>
    </template>

  

  </div>
</div>




  <div class="main" >
    
    <div class="his_cardi" style="overflow-x: scroll;  scrollbar-width: none; margin-right: 10px;">

 
      <button @click="shareChat" class="btn-ice"><span><svg xmlns="http://www.w3.org/2000/svg" style="padding:3px" width="40" height="40" fill="currentColor" class="bi bi-webcam" viewBox="0 0 16 16">
  <path d="M0 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H9.269c.144.162.33.324.531.475a7 7 0 0 0 .907.57l.014.006.003.002A.5.5 0 0 1 10.5 13h-5a.5.5 0 0 1-.224-.947l.003-.002.014-.007a5 5 0 0 0 .268-.148 7 7 0 0 0 .639-.421c.2-.15.387-.313.531-.475H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/>
  <path d="M8 6.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0m7 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"/>
</svg></span>Live Captioning</button> 
<button @click="shareChat" style="margin-top: 0;"class="btn-ice"><span><svg xmlns="http://www.w3.org/2000/svg" style="padding:3px" width="38" height="38" fill="currentColor" class="bi bi-image" viewBox="0 0 16 16">
  <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
  <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z"/>
</svg></span>Image Captioning</button> 
        
    
  </div>
  



  
  <div style="display: flex; flex-direction: column; width: 75%; height: 88vh;">
  <div class="card" style="flex: 3;">
   
  </div>
  <div class="card" style="flex: 1;">
   Image Caption
  </div>
</div>

  


      
    </div>


</template>
