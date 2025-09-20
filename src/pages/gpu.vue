<script setup>
import history_element from './components/history_element.vue'
import chat_element from './components/chat_element.vue'
import 'material-icons/iconfont/material-icons.css'
import { CreateMLCEngine,  prebuiltAppConfig } from '@mlc-ai/web-llm'

import { ref, onMounted } from 'vue'
import progress_bar from './components/progress_bar.vue'
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
const loading  = ref(false)
const selectedModel = ref('')
const progress = ref(0)
const isStreaming = ref(false)
const error = ref(null)  
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
const selectedMode = ref('')
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

  const date = new Date().toLocaleString()

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
   
  const parms = new URLSearchParams(window.location)
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

    localStorage.setItem("visited", "true")
  }


})


async function modei(mode_choice) {
  selectedMode.value = mode_choice

  if (mode_choice === 'cpu') {
    router.push('/cpu')
  } else if (mode_choice === 'vlm') {
    router.push('/vlm')
  } else if (mode_choice === 'gpu') {
    
    loading.value = true


    const initProgressCallback = (report) => {
      const val = typeof report === 'number'
        ? report
        : typeof report?.progress === 'number'
        ? report.progress
        : 0
      progress.value = Math.round(val <= 1 ? val * 100 : val)
    }

    try {
      engine = await CreateMLCEngine(selectedModel.value, { initProgressCallback })
      console.log('GPU engine loaded!')
    } catch (err) {
      console.error("Engine init failed:", err)
      error.value = err?.stack || err?.message || String(err)
    } finally {
      loading.value = false
    }
  }
}

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
    <a style="font-family:Noto Sans, sans-serif; font-weight:600; font-size: larger; margin:0.2rem">Lanthanum.AI</a>
   
    <div style="width:95%; display:flex; justify-content:flex-end; gap:0.5rem;">
   

   <router-link to="/cpu"><button class="btn-ic" ><span class="material-icons">memory</span>Use CPU</button></router-link>
   <button @click="shareChat" class="btn-ic"><span  class="material-icons">ios_share</span>Share Chat</button> 
   <button @click="toggleSystemInfo" class="btn-ic"><span  class="material-icons">computer</span>Stats</button>
</div>

  </header>

  <div v-if="showSystemPopup" class="overlay">
  <div style="margin:10px">
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
</div>
</div>
<div v-if="!selectedMode">
  <div class ="overlay">
    <div class="card" style="justify-content: center; align-items: center; width:30vw; background-color:#242424; text-align:center; padding:1rem;">
      <h3 style="color:white;">Select Mode!</h3>
      <div style="display:flex; flex-direction: row; gap:10px; justify-content: center; align-items: center"> 
      <div @click="modei('cpu')" class="card" style="justify-content: center; align-items: center; height:100px; width:100px; cursor:pointer; display: flex; flex-direction: column; gap:5px"  ><span style="font-size:20px">CPU</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" class="bi bi-cpu" viewBox="0 0 16 16">
  <path d="M5 0a.5.5 0 0 1 .5.5V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2A2.5 2.5 0 0 1 14 4.5h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14a2.5 2.5 0 0 1-2.5 2.5v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14A2.5 2.5 0 0 1 2 11.5H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2A2.5 2.5 0 0 1 4.5 2V.5A.5.5 0 0 1 5 0m-.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3zM5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5zM6.5 6a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
</svg>
<span style="font-size:xx-small; font-family: consolas;">Uses CPU power to run AI model!</span></div>
      <div @click="modei('gpu')" class="card" style="justify-content: center; align-items: center; height:100px; width:100px; cursor:pointer; display: flex; flex-direction: column; gap:5px"  ><span style="font-size:20px" >GPU</span><svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" class="bi bi-gpu-card" viewBox="0 0 16 16">
  <path d="M4 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0m7.5-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>
  <path d="M0 1.5A.5.5 0 0 1 .5 1h1a.5.5 0 0 1 .5.5V4h13.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H2v2.5a.5.5 0 0 1-1 0V2H.5a.5.5 0 0 1-.5-.5m5.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M9 8a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0"/>
  <path d="M3 12.5h3.5v1a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 1-.5-.5zm4 1v-1h4v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5"/>
</svg><span style="font-size:xx-small; font-family: consolas;">Uses your GPU power to run AI model!</span></div>
<div @click="modei('vlm')" class="card" style="justify-content: center; align-items: center; height:100px; width:100px; cursor:pointer; display: flex; flex-direction: column; gap:0px"  ><span style="font-size:20px" >VLM</span><svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" class="bi bi-webcam" viewBox="0 0 16 16">
  <path d="M0 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H9.269c.144.162.33.324.531.475a7 7 0 0 0 .907.57l.014.006.003.002A.5.5 0 0 1 10.5 13h-5a.5.5 0 0 1-.224-.947l.003-.002.014-.007a5 5 0 0 0 .268-.148 7 7 0 0 0 .639-.421c.2-.15.387-.313.531-.475H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/>
  <path d="M8 6.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0m7 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"/>
</svg> <span style="font-size:xx-small; font-family: consolas;">A Live Vision Model Running in your broswer</span></div>
    </div> 
    <p style="font-size:small; font-family: consolas;">Note: USE GPU or VLM feature as they are stable , don't prefer cpu as it is slow and time taking , it is there only as a failsafe</p>
    </div> 
    
  </div>
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
         <div style="margin:10px; width:100%; height:10%;  padding:0.5rem;"> 
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
         <div v-for="chat in historyList" :key="chat.id" style="display:flex; align-items:center; width:100%;justify-content:space-between; padding:0.5rem; cursor:pointer;">
  <div @click="openHistoryChat(chat.id)">
    <history_element :Heading="chat.title" Subject="Saved Chat" :chatId="chat.id" @delete="deleteHistoryChat"  />
  </div>
  
</div>
    </div>

  
    <div style="display: flex; flex-direction: column; flex: 1;">
      <div class="card"
           style="width: auto; height: 100%; scrollbar-width: none; overflow-y: scroll; padding: 1rem;">
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
