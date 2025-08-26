<script setup>
import history_element from './components/history_element.vue'
import chat_element from './components/chat_element.vue'
import 'material-icons/iconfont/material-icons.css'
import { CreateMLCEngine,  prebuiltAppConfig } from '@mlc-ai/web-llm'

import { ref, onMounted } from 'vue'

import { useRoute, useRouter } from 'vue-router'

// ▒█▀▀█ ▒█▀▀▀█ ▒█▀▀▄ ▒█▀▀▀ ▒█▀▀▄ 　 ▒█▀▀█ ▒█░░▒█ 
// ▒█░░░ ▒█░░▒█ ▒█░▒█ ▒█▀▀▀ ▒█░▒█ 　 ▒█▀▀▄ ▒█▄▄▄█ 
// ▒█▄▄█ ▒█▄▄▄█ ▒█▄▄▀ ▒█▄▄▄ ▒█▄▄▀ 　 ▒█▄▄█ ░░▒█░░

// ███████╗███╗░░██╗██████╗░██╗███╗░░██╗██╗░░░██╗░█████╗░██╗██████╗░
// ██╔════╝████╗░██║██╔══██╗██║████╗░██║██║░░░██║██╔══██╗██║██╔══██╗
// █████╗░░██╔██╗██║██║░░██║██║██╔██╗██║╚██╗░██╔╝██║░░██║██║██║░░██║
// ██╔══╝░░██║╚████║██║░░██║██║██║╚████║░╚████╔╝░██║░░██║██║██║░░██║
// ███████╗██║░╚███║██████╔╝██║██║░╚███║░░╚██╔╝░░╚█████╔╝██║██████╔╝
// ╚══════╝╚═╝░░╚══╝╚═════╝░╚═╝╚═╝░░╚══╝░░░╚═╝░░░░╚════╝░╚═╝╚═════╝░

const input    = ref('')
const messages = ref([])
const loading  = ref(true)
const selectedModel = ref('')
const progress = ref(0)
const isStreaming = ref(false)


let engine = null
let currentStream = null  
let stopRequested = false  
const modelList = ref([])  
const route = useRoute()
const router = useRouter()




const historyList = ref([])
const currentChatId = ref(null)
const showSystemPopup = ref(false)
const systemInfo = ref({})

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

function saveChatHistory() {
  if (!messages.value.length) return

  const id = currentChatId.value || Date.now().toString()
  const title =
    messages.value.find(m => m.person === 'User')?.personi?.slice(0, 30) ||
    "New Chat"

  const date = new Date().toLocaleString() // add date string

  const chat = {
    id,
    title,
    date,
    messages: JSON.parse(JSON.stringify(messages.value))
  }

  const idx = historyList.value.findIndex(c => c.id === id)
  if (idx !== -1) {
    historyList.value[idx] = chat
  } else {
    historyList.value.push(chat)
  }

  localStorage.setItem("chatHistory", JSON.stringify(historyList.value))
  currentChatId.value = id
}



function loadHistory() {
  const saved = localStorage.getItem("chatHistory")
  if (saved) {
    historyList.value = JSON.parse(saved)
  }
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

function formatModelName(model) {

  const parts = model.split('-')


  const quantPart = parts.find(p => p.startsWith('q')) || ''

 
  let baseName = parts[0]
  if (parts[1] && /\d/.test(parts[1])) {
    baseName += '-' + parts[1]
  }

  return `${baseName}   |   ${quantPart}`
}



onMounted(async () => {
  loadHistory()
   
  const parms = new URLSearchParams(window.location.searc)
  if (parms.get('model')){
    this.selectedModel = params.get('model');
  }

  modelList.value = prebuiltAppConfig.model_list.map(m => m.model_id)
  selectedModel.value = route.query.model || modelList.value[35] 
  
  if (route.query.chat) {
    try {
      messages.value = JSON.parse(atob(route.query.chat))
    } catch (err) {
      console.error('Failed to decode chat:', err)
    }
  }


  console.log('loadingggggggggggggggggggggg')
  if (!selectedModel.value) {
    loading.value = false
    return
  }


  if (!localStorage.getItem("visited")) {
    showSystemPopup.value = true
    localStorage.setItem("visited", "true")
  }



  const initProgressCallback = (report) => {
    const val =
      typeof report === 'number'
        ? report
        : typeof report?.progress === 'number'
        ? report.progress
        : 0
    progress.value = Math.round(val <= 1 ? val * 100 : val)
  }

  try {
    engine = await CreateMLCEngine(selectedModel.value, { initProgressCallback })
  } catch (err) {
    console.error('Engine init failed:', err)
  } finally {
    loading.value = false
  }
})


function newModel(model){
  if (model)
    window.location.href =  `${window.location.origin}${window.location.pathname}?model=${model}`
  
} 


function shareChat(){
  const data = {
    model: selectedModel.value,
    messages: messages.value
  }

  const url = new URL(window.location.href)
  url.searchParams.set('model', selectedModel.value)
  url.searchParams.set('chat', btoa(JSON.stringify(data.messages)))

  navigator.clipboard.writeText(url.toString())
    .then(() => {
      alert('Link copied! Share it with others.')
    })
    .catch(err => {
      console.error('Failed to copy:', err)
    })
}

const newChat = () => {
  messages.value = []
  currentChatId.value = null
  const id = Date.now().toString()
  historyList.value.push({
    id,
    title: "New Chat",
    date: new Date().toLocaleString(),
    messages: []
  })
  currentChatId.value = id
  localStorage.setItem("chatHistory", JSON.stringify(historyList.value))
}


async function sendmsg () {
  
  const text = input.value.trim()
  if (!text || !engine || isStreaming.value) return

  messages.value.push({ person: 'User', personi: text })
  input.value = ''

  const chatMessages = messages.value.map(m => ({
    role: m.person === 'User' ? 'user' : 'assistant',
    content: m.personi
  }))

  let reply = ''
  messages.value.push({ person: 'AI', personi: '' })
  const aiIndex = messages.value.length - 1

  try {
    stopRequested = false
    isStreaming.value = true

    currentStream = await engine.chat.completions.create({
      messages: chatMessages,
      stream: true
    })

    for await (const chunk of currentStream) {
      if (stopRequested) break
      const delta = chunk.choices?.[0]?.delta?.content || ''
      if (delta) {
        reply += delta
        messages.value[aiIndex].personi = reply
      }
    }
  } catch (err) {
    console.error('Chat failed:', err)
    messages.value[aiIndex].personi = '(error generating response)'
  } finally {
    isStreaming.value = false
    currentStream = null
  }
  saveChatHistory()

}
</script>

<template>
  <header
    style="display:flex; flex-direction: row; border-radius: 13px; border-width: 2px; border-color: white; border-style: solid; color: white; padding:0.5rem;"
  >
    <a style="margin:0.2rem">WEB - AI</a>
   
    <div style="width:95%; display:flex; justify-content:flex-end;">
      <span style="margin:0.2rem" v-if="loading"> Loading {{ progress }}%</span>
 
    <span @click="shareChat" class="material-icons">ios_share</span>
    <span @click="toggleSystemInfo" class="material-icons" style="cursor:pointer; margin:0.2rem;">
      memory
    </span>
</div>

  </header>

  <div v-if="showSystemPopup" class="overlay">
  <div class="card" style="width:30vw; background-color: #242424;">
    <h4 style="margin:8px 0;">System Info</h4>
    <div style="margin:2px;">RAM: {{ systemInfo.ram }}</div>
    <div style="margin:2px;">CPU Cores: {{ systemInfo.cpu }}</div>
    <div style="margin:2px;">Heap Used: {{ systemInfo.heapUsed }}</div>
    <div style="margin:2px;">Heap Limit: {{ systemInfo.heapLimit }}</div>
    <div style="margin:2px;">WebGPU: {{ systemInfo.webgpu }}</div>
    <h2 style="color:red"> WARNING DONT RUN HEAVY MODEL ! PC MAY CRASH </h2>
    <button 
      @click="showSystemPopup=false" 
      style="margin-top:8px; padding:6px 12px; border:none; border-radius:6px; background:#333; color:white; cursor:pointer;">
      Close
    </button>
  </div>
</div>



  <div class="main" >
    
    <div class="his_card" style="overflow-x: scroll; scrollbar-width: none; width: fit-content; margin-right: 10px;">
      <button class="model-select" @click="newChat" style="margin:10px; width:22vw ;  padding:0.5rem;">Add new Chat</button>
         <div style="margin:10px; width:100%; height:10%;  padding:0.5rem;" class=""> 
          <a>Select Model : </a> 
          <div style="height:10px"></div>
          <select
          class="model-select"
           v-model="selectedModel" 
           :disabled="loading || isStreaming"
           @change="newModel(selectedModel)">

    <option v-for="m in modelList" :key="m" :value="m">{{ formatModelName(m) }}</option>
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
        <button @click="() => isStreaming ? engine.interruptGenerate() : sendmsg()" :disabled="loading" style="border: none; background-color: #242424; color: white; padding: 0.2rem;">
          <span class="material-icons"> {{ isStreaming ? 'stop_circle' : 'arrow_forward_ios' }}</span>
        </button>

      </div>
    </div>
  </div>
</template>
