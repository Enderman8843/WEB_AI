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

function onModelChange(model) {
  router.push({
    query: {
      ...route.query,
      model
    }
  })
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
}
</script>

<template>
  <header
    style="display:flex; flex-direction: row; border-radius: 13px; border-width: 2px; border-color: white; border-style: solid; color: white; padding:0.5rem;"
  >
    <a style="margin:0.2rem">WEB - AI</a>
   
    <div style="width:95%; display:flex; justify-content:flex-end;">
      <span style="margin:0.2rem" v-if="loading"> Loading {{ progress }}%</span>
  <button @click="shareChat" 
          style="border:none; background-color:#242424; color:white; padding:0.2rem; border-radius:8px; cursor:pointer;">
    <span class="material-icons">ios_share</span>
  </button>
</div>

  </header>

  <div style="display: flex; flex-direction: row;">
   
    <div class="his_card"
         style="overflow: scroll; scrollbar-width: none; width: 25vw; margin-right: 10px; height: 86vh;">
         <div style="margin:10px; width:100%; height:10%;  padding:0.5rem;" class=""> 
          <a>Select Model</a> 
          <select
          class="model-select"
           v-model="selectedModel" 
           :disabled="loading || isStreaming"
           @change="newModel(selectedModel)">

    <option v-for="m in modelList" :key="m" :value="m">{{ formatModelName(m) }}</option>
  </select></div>
         <div style="background-color:white; height:1px"></div>
      <history_element Heading="Random" Subject="Random Chat" />
    </div>

  
    <div style="display: flex; flex-direction: column; flex: 1;">
      <div class="card"
           style="width: 75vw; height: 70vh; scrollbar-width: none; overflow-y: scroll; padding: 1rem;">
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
