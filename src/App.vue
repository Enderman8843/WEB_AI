<script setup>
import history_element from './components/history_element.vue'
import chat_element from './components/chat_element.vue'
import 'material-icons/iconfont/material-icons.css'
import { ref, onMounted } from 'vue'
import { CreateMLCEngine } from '@mlc-ai/web-llm'


const MODEL = 'SmolLM2-1.7B-Instruct-q4f16_1-MLC'

const input    = ref('')
const messages = ref([])
const loading  = ref(true)
const progress = ref(0)
const isStreaming = ref(false)


let engine = null
let currentStream = null  
let stopRequested = false  

onMounted(async () => {
  try {
    const initProgressCallback = (report) => {
      const val = typeof report === 'number'
        ? report
        : (typeof report?.progress === 'number' ? report.progress : 0)
      progress.value = Math.round(val <= 1 ? val * 100 : val)
    }

    engine = await CreateMLCEngine(MODEL, { initProgressCallback })
    loading.value = false
  } catch (err) {
    console.error('Engine init failed:', err)
  }
})


function stop() {
  stopRequested = true
  isStreaming.value = false
  console.log(' I had loved her')
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
    style="border-radius: 20px; border-width: 2px; border-color: white; border-style: solid; color: white; padding: 1rem;"
  >
    <a>WEB - AI</a>
    <span v-if="loading"> — loading {{ progress }}%</span>
  </header>

  <div style="display: flex; flex-direction: row;">

    <div class="card"
         style="overflow: scroll; scrollbar-width: none; width: 25vw; margin-right: 10px; height: 80vh">
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
