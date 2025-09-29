<script setup>
import 'material-icons/iconfont/material-icons.css'
import sys from './components/sys_stats.vue'
import progress_bar from './components/progress_bar.vue'
import { ref, onMounted } from 'vue'

const showSystemPopup = ref(false)
const worker = ref(null)

const imageUrl = ref("")
const videoUrl = ref("")
const previewUrl = ref("")
const customPrompt = ref("")
const output = ref("")
const error = ref("")

const modelLoading = ref(false)
const progress = ref(0)

const videoRef = ref(null)
const videoActive = ref(false)
let captureInterval = null
const frameInterval = 8000
let isGenerating = false  

function toggleSystemInfo() { showSystemPopup.value = !showSystemPopup.value }
function setError(msg) { error.value = msg }
function clearError() { error.value = "" }


onMounted(() => {
  worker.value = new Worker(new URL('../worker_vlm.js', import.meta.url), { type: 'module' })

  worker.value.onmessage = (e) => {
    const { type, text, tokens, error: err } = e.data;

    if (type === "ready") modelLoading.value = false;
    if (type === "progress" && tokens !== undefined) {
      modelLoading.value = true
      progress.value = tokens
    }

    if (type === "progress" && tokens === undefined) {
      output.value = text
    }

    if (type === "caption") {
      output.value = text
      isGenerating = false
    }

    if (type === "error") {
      setError(err)
      modelLoading.value = false
      isGenerating = false
    }
  }

  modelLoading.value = true
  worker.value.postMessage({ type: "init" })
})

function generateCaption(url) {
  if (isGenerating) return
  isGenerating = true
  clearError()
  output.value = "" // THis part is CHatGPT

  const promptText = customPrompt.value.trim() || "Describe this image in one line."
  worker.value.postMessage({ type: "caption", url, prompt: promptText })
}


function handleFile(e) {
  const file = e.target.files[0]
  if(!file || !file.type.startsWith("image/")) return setError("Please upload a valid image file.")
  const url = URL.createObjectURL(file)
  previewUrl.value = url
  imageUrl.value = url
  videoActive.value = false
  stopCapturingFrames()
}

function handleVideoFile(e) {
  const file = e.target.files[0]
  if(!file || !file.type.startsWith("video/")) return setError("Please upload a valid video file.")
  const url = URL.createObjectURL(file)
  videoUrl.value = url
  previewUrl.value = url
  videoActive.value = true
  stopCapturingFrames()
}

async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    videoRef.value.srcObject = stream
    await videoRef.value.play()
    videoActive.value = true
    stopCapturingFrames()
  } catch (err) {
    setError("Cannot access webcam: " + err.message)
  }
}

function stopWebcam() {
  if (videoRef.value?.srcObject) {
    videoRef.value.srcObject.getTracks().forEach(track => track.stop())
    videoRef.value.srcObject = null
  }
  videoActive.value = false
  stopCapturingFrames()
}

function startCapturingFrames() {
  stopCapturingFrames()
  captureInterval = setInterval(() => {
    if (!videoRef.value || videoRef.value.readyState < 2) return
    if (isGenerating) return

    const canvas = document.createElement("canvas")
    canvas.width = videoRef.value.videoWidth / 2
    canvas.height = videoRef.value.videoHeight / 2
    const ctx = canvas.getContext("2d")
    ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
    const frame = canvas.toDataURL("image/png")

    generateCaption(frame)
  }, frameInterval)
}

function stopCapturingFrames() {
  clearInterval(captureInterval)
}
</script>



<template>
  <header style="display:flex; flex-direction: row; border-radius: 13px; border-width: 2px; border-color: white; border-style: solid; color: white; padding:0.5rem;">
    <a style="font-family:Noto Sans, sans-serif; font-weight:600; font-size: larger; margin:0.2rem">Lanthanum.AI</a>
    <div style="width:95%; display:flex; justify-content:flex-end; gap:0.5rem;">
      <button class="btn-ic" @click="toggleSystemInfo">
        <span class="material-icons">computer</span>Stats
      </button>
    </div>
  </header>

  <div v-if="showSystemPopup" class="overlay"><sys /></div>

  
  <div v-if="modelLoading || error" class="overlay">
    <div class="card" style="width:30vw; background-color:#242424; text-align:center; padding:1rem;">
      <template v-if="modelLoading && !error">
        <h3 style="color:white;">Loading Model...</h3>
        <progress_bar :progress="progress" />
        <p style="color:white;">{{ progress }}%</p>
        <p style="color:gray; font-size:0.9rem;">This may take up to 1–2 minutes</p>
      </template>
      <template v-else-if="error">
        <div style="background-color:#6b6767; padding:1rem; border-radius:10px; max-height:150px; overflow-y:auto; font-size:0.9rem;">
          <p style="font-family:consolas;">Error Occurred: {{ error }}</p>
        </div>
      </template>
    </div>
  </div>

  <div class="main" style="display:flex; flex-direction: row; width:100%; gap:1rem; margin-top:1rem;">
    <div class="his_cardi" style="overflow-x: scroll; scrollbar-width: none; margin-right: 10px;">
      <input type="file" accept="image/*" @change="handleFile" />
      <input type="file" accept="video/*" @change="handleVideoFile" />
      <input v-model="imageUrl" placeholder="Enter image URL" />
      <button :disabled="!previewUrl" @click="generateCaption(previewUrl)">Generate Caption</button>
      <hr />
      <button @click="startWebcam">Start Webcam</button>
      <button @click="stopWebcam">Stop Webcam</button>
      <button :disabled="!videoActive" @click="startCapturingFrames">Start Live Caption</button>
      <button :disabled="!videoActive" @click="stopCapturingFrames">Stop Live Caption</button>
    </div>

    <div style="display:flex; flex-direction: column; width:75%; height:88vh;">
      <div class="card" style="flex:3; display:flex; justify-content:center; align-items:center; background:#1e1e1e;">
        <img v-if="previewUrl && !videoActive" :src="previewUrl" alt="Preview" style="max-width:100%; max-height:100%;" />
        <video v-show="videoActive" ref="videoRef" autoplay muted playsinline style="max-width:100%; max-height:100%; background:black;"></video>
      </div>


      <div class="card" style="flex:1; padding:1rem; background:#242424; color:white; overflow-y:auto; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <textarea v-model="customPrompt" placeholder="Custom prompt (optional)" style="width:100%; height:50px; margin-bottom:1rem; font-size:1rem;"></textarea>
        <div v-if="output" style="font-size:2rem; font-weight:600; color:#e8e8e8; text-align:center; white-space:pre-wrap; word-wrap:break-word;">
          {{ output }}
        </div>
      </div>
    </div>
  </div>
</template>
