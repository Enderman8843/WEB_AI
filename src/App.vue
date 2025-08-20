<script setup>
import history_element from './components/history_element.vue'
import chat_element from './components/chat_element.vue'
import 'material-icons/iconfont/material-icons.css'
import { ref, onMounted, watch } from 'vue'
import { CreateMLCEngine,  prebuiltAppConfig } from '@mlc-ai/web-llm'
import { useRoute, useRouter } from 'vue-router'


const route = useRoute()
const MODEL = route.query.model || 'SmolLM2-1.7B-Instruct-q4f16_1-MLC'
const router = useRouter()
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



onMounted(async () => {

  modelList.value = prebuiltAppConfig.model_list.map(m => m.model_id)
  selectedModel.value = route.query.model || modelList.value[0] || ''


  if (!selectedModel.value) {
    loading.value = false
    return
  }


  watch(
  () => route.query.model,          
  async (newModel) => {
    if (!newModel || !modelList.value.includes(newModel)) return

    selectedModel.value = newModel
    loading.value = true
    progress.value = 0

    
    if (engine) await engine.unload?.()

    
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
      engine = await CreateMLCEngine(newModel, { initProgressCallback })
    } catch (err) {
      console.error('Engine init failed:', err)
    } finally {
      loading.value = false
    }
  },
  { immediate: true }            
)



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
    style="border-radius: 20px; border-width: 2px; border-color: white; border-style: solid; color: white; padding: 1rem;"
  >
    <a>WEB - AI</a>
    <span v-if="loading"> — loading {{ progress }}%</span>
    
  </header>

  <div style="display: flex; flex-direction: row;">

    <div class="his_card"
         style="overflow: scroll; scrollbar-width: none; width: 25vw; margin-right: 10px; height: 86vh;">
         <div style="margin:10px; width:80%; height:5%;  padding:1rem;" class="card">  
          <select
           v-model="selectedModel" 
           :disabled="loading || isStreaming"
           @change="onModelChange(selectedModel)">

    <option v-for="m in modelList" :key="m" :value="m">{{ m }}</option>
  </select></div>
         <div style="background-color:white; height:1px"></div>
      <history_element Heading="Random" Subject="Random Chat" />
    </div>

  
    <div style="display: flex; flex-direction: column; flex: 1;">
      <div class="card"
           style="width: 75vw; height: 70vh; overflow-y: scroll; padding: 1rem;">
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
        <button @click="sendmsg" :disabled="loading || isStreaming" style="border: none; background-color: #242424; color: white; padding: 0.5rem;">
          <span class="material-icons">arrow_forward_ios</span>
        </button>

      </div>
    </div>
  </div>
</template>
