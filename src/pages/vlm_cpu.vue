<script setup>
import 'material-icons/iconfont/material-icons.css'
import sys from './components/sys_stats.vue'
import progress_bar from './components/progress_bar.vue'
import { ref, onMounted, watch } from 'vue'

const showSystemPopup = ref(false)
const worker = ref(null)
const activeTab = ref("video")
const fileInput = ref(null)
const videoInput = ref(null)
const videoRef = ref(null)
const fileName = ref("Upload Image")
const imageUrl = ref("")
const videoUrl = ref("")
const previewUrl = ref("")
const videoActive = ref(false)
const capturing = ref(false)
const customPrompt = ref("")
const output = ref("") 
const error = ref("")
const modelLoading = ref(false)
const progress = ref(0)
let isGenerating = false  
const stream = ref(null)


let captureInterval = null
const frameInterval = 8000


function toggleSystemInfo() { showSystemPopup.value = !showSystemPopup.value }

function setError(msg) { error.value = msg }
function clearError() { error.value = "" }



watch(activeTab, (newTab, oldTab) => {
  if (oldTab === "video" && newTab !== "video") {
    stopWebcam()
  }
})

onMounted(() => {
  worker.value = new Worker(new URL('../worker_vlm_cpu.js', import.meta.url), { type: 'module' })

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
  output.value = "Caption is generating..."


  if (!videoActive.value) activeTab.value = 'image'

  const promptText = customPrompt.value.trim() || "Describe this image in one line."
  worker.value.postMessage({ type: "caption", url, prompt: promptText })
}


function triggerFileInput() { if (activeTab.value === "image") fileInput.value.click() }
function handleFile(e) {
  const file = e.target.files[0]
  if(!file || !file.type.startsWith("image/")) return setError("Please upload a valid image file.")
  const url = URL.createObjectURL(file)
  previewUrl.value = url
  imageUrl.value = url
  fileName.value = file.name
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

  if (videoRef.value) {
    videoRef.value.srcObject = null
    videoRef.value.src = url
    videoRef.value.play().catch(err => setError(err.message))
  }
}


function removeVideo() {
  if (capturing.value) toggleCapturingFrames()
  stopWebcam()
  videoUrl.value = ""
  previewUrl.value = ""
  videoActive.value = false
  if (videoRef.value) {
    videoRef.value.src = ""
    videoRef.value.srcObject = null
  }
}

// Webcam controls
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

    videoRef.value.srcObject.getTracks().forEach(track => {
      track.stop()
    })
  }


  videoRef.value.pause()
  videoRef.value.srcObject = null
  videoRef.value.src = ""

  videoActive.value = false
  stopCapturingFrames()
}


function toggleCapturingFrames() {
  if (capturing.value) {
    clearInterval(captureInterval)
    captureInterval = null
    capturing.value = false
  } else {
    if (!videoActive.value) return
    capturing.value = true
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
}


function stopCapturingFrames() {
  if (captureInterval) {
    clearInterval(captureInterval)
    captureInterval = null
  }
  capturing.value = false
}
</script>

<template>
  <header style="display:flex; flex-direction: row; border-radius: 13px; border-width: 2px; border-color: white; border-style: solid; color: white; padding:0.5rem;">
    <a style="font-family:Noto Sans, sans-serif; font-weight:600; font-size: larger; margin:0.2rem">Lanthanum.AI</a>
    <div style="width:95%; display:flex; justify-content:flex-end; gap:0.5rem;">
      
      <router-link to="/">
      <button class="btn-ic" >
        <span class="material-icons">home</span>Home
      </button>
    </router-link>
    <router-link to="/vlm"><button class="btn-ic" ><span class="material-icons">memory</span>Use GPU</button></router-link>
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
        <p style="color:gray; font-size:0.9rem;">Note : This model works properly with webGPU , cpu support is quite unstable so you may get out of memeory or unable to start it</p>
      </template>
      <template v-else-if="error">
    <div>
      <div style="background-color:  #6b6767;; ; padding:1rem; border-radius:10px;
                max-height:150px; overflow-y:auto; font-size:0.9rem;">
                
    <p style="font-family: consolas;">Error Occured: {{ error }}</p>
    </div>
    
    <p style="font-size:small; font-family: consolas;">Note : This model works properly with webGPU , cpu support is quite unstable so you may get out of memeory or unable to start it</p>
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

  <div class="main" style="display:flex; flex-direction: row; width:100%; gap:1rem; margin-top:1rem;">
    <div id="app" class="his_cardi" style="overflow-x: hidden; margin-right: 10px;">
      <div class="tab-header" style="display:flex; gap:1rem; margin-bottom:1rem;">
        <button :class="{active: activeTab==='image'}" @click="activeTab='image'" class="tab-btn">
          Image
        </button>
        <button :class="{active: activeTab==='video'}" @click="activeTab='video'" class="tab-btn">
          Video
        </button>
      </div>
      <h2 style="margin:13px 0px 0px 13px">Image Caption</h2>
      <div v-if="activeTab==='image'" class="tab-content card-m">
        <button style="margin:16px" class="btn-ic" @click="triggerFileInput">
          <span class="material-icons">upload_file</span>
          {{ fileName }}
        </button>
        <input type="file" accept="image/*" ref="fileInput" @change="handleFile" style="display:none;" />

        <button style="margin:0px 16px 16px 16px; display:flex; align-items:center; justify-content:center;" class="btn-ic" :disabled="!previewUrl" @click="generateCaption(previewUrl)">
          Generate Caption
        </button>
      </div>
      <div v-if="activeTab==='video'" class="tab-content card-m">
        <button class="btn-ic" @click="$refs.videoInput.click()" style="margin:16px">
          <span class="material-icons">video_file</span>
          Upload Video
        </button>
        <input type="file" accept="video/*" ref="videoInput" @change="handleVideoFile" style="display:none;" />

        <button v-if="videoUrl" class="btn-ic" style="margin:0px 16px 16px 16px;" @click="removeVideo">
          <span class="material-icons">delete</span>
          Remove Video
        </button>

        <button class="btn-ic" style="margin:0px 16px 16px 16px;" @click="startWebcam">
          <span class="material-icons">videocam</span>
          Start Webcam
        </button>
        <button class="btn-ic" style="margin:0px 16px 16px 16px;" @click="stopWebcam" :disabled="!videoActive">
          <span class="material-icons">stop_circle</span>
          Stop Webcam
        </button>

        <button style="margin:0px 16px 16px 16px; display:flex; align-items:center; justify-content:center;" 
        class="btn-ic" 
        :disabled="!videoActive" 
        @click="toggleCapturingFrames">
  {{ capturing ? "Stop Capturing" : "Generate Live Caption" }}
</button>

      </div>
    </div>

    <div style="display:flex; flex-direction: column; width:75%; height:88vh;">
      <div class="card" style="flex:3; display:flex; justify-content:center; align-items:center; background:#1e1e1e; min-height:0;">
        <a style="color:#b3b3ba" v-if="!previewUrl && !videoActive">
          Upload Image or Give access to webcam from the sidebar
        </a>
        <img v-if="previewUrl && !videoActive" :src="previewUrl" alt="Preview" style="max-width:100%; max-height:100%; object-fit:contain;" />
        <video v-show="videoActive" ref="videoRef" autoplay muted playsinline style="max-width:100%; max-height:100%; background:black; object-fit:contain;"></video>
      </div>

      <div class="card" style="flex:0.5; padding:1rem; background:#242424; color:white; overflow-y:auto; display:flex; flex-direction:column;">
        <a>Caption:</a>
        {{ output }}
      </div>
    </div>
  </div>
</template>
