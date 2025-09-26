<script setup>
import 'material-icons/iconfont/material-icons.css'
import sys from './components/sys_stats.vue'
import progress_bar from './components/progress_bar.vue'
import { ref, nextTick, onMounted } from 'vue'
import {
  AutoProcessor,
  AutoModelForImageTextToText,
  load_image,
  TextStreamer
} from "@huggingface/transformers"


const showSystemPopup = ref(false)
const processor = ref(null)
const model = ref(null)
const isModelLoaded = ref(false)


const imageUrl = ref("")
const videoUrl = ref("")
const previewUrl = ref("") 
const customPrompt = ref("")
const output = ref("")
const loading = ref(false)
const loadingText = ref("")
const progress = ref(0)
const error = ref("")
const generating = ref(false)

const videoRef = ref(null)
const videoActive = ref(false)
let captureInterval = null
const frameInterval = 1000 
let isGenerating = false  

function toggleSystemInfo() { showSystemPopup.value = !showSystemPopup.value }

function setLoading(text, pct = 50) {
  loading.value = true
  loadingText.value = text
  progress.value = pct
}
function clearLoading() {
  loading.value = false
  progress.value = 0
}
function setError(msg) { error.value = msg }
function clearError() { error.value = "" }


async function initializeModel() {
  if (isModelLoaded.value) return
  try {
    setLoading("Loading processor...", 20)
    const model_id = "onnx-community/FastVLM-0.5B-ONNX"
    processor.value = await AutoProcessor.from_pretrained(model_id)

    setLoading("Loading model...", 60)
    model.value = await AutoModelForImageTextToText.from_pretrained(model_id, {
      device: "wasm",
      
    })

    isModelLoaded.value = true
    clearLoading()
  } catch(err) {
    console.error("Model load failed:", err)
    setError("Failed to load model. Please try again.")
    clearLoading()
  }
}


async function generateCaption(url, showProgress = false) {
  if (isGenerating) return 
  isGenerating = true
  generating.value = true

  try {
    clearError()
    if (!isModelLoaded.value) await initializeModel()
    if (!processor.value) throw new Error("Processor not loaded")

    

    const promptText = customPrompt.value.trim() || "Describe this image in detail."
    const messages = [{ role:"user", content:`<image>${promptText}` }]
    const prompt = processor.value.apply_chat_template(messages, { add_generation_prompt:true })

    const image = await load_image(url)
    const inputs = await processor.value(image, prompt, { add_special_tokens:false })


    if (showProgress) output.value = ""  

    await model.value.generate({
      ...inputs,
      max_new_tokens:512,
      do_sample:false,
      streamer: new TextStreamer(processor.value.tokenizer, {
        skip_prompt:true,
        skip_special_tokens:false,
        callback_function: text => { output.value += text }
      })
    })

    if (showProgress) clearLoading()
  } catch(err) {
    console.error("Caption error:", err)
    setError("Failed to generate caption. Try again.")
    if (showProgress) clearLoading()
  } finally {
    isGenerating = false
    generating.value = false

  }
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
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Your browser does not support webcam access")
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    videoRef.value.srcObject = stream
    await videoRef.value.play()
    videoActive.value = true
    stopCapturingFrames()
    console.log("Webcam started successfully")
  } catch (err) {
    console.error("Webcam error:", err)
    setError("Cannot access webcam: " + err.message)
  }
}

function stopWebcam() {
  if (videoRef.value?.srcObject) {
    const tracks = videoRef.value.srcObject.getTracks()
    tracks.forEach(track => track.stop())
    videoRef.value.srcObject = null
  }
  videoActive.value = false
  stopCapturingFrames()
}

function startCapturingFrames() {
  stopCapturingFrames()
  captureInterval = setInterval(async () => {
    if (!videoRef.value || videoRef.value.readyState < 2) return
    if (isGenerating) return

    const canvas = document.createElement("canvas")
    canvas.width = videoRef.value.videoWidth / 2
    canvas.height = videoRef.value.videoHeight / 2
    const ctx = canvas.getContext("2d")
    ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
    const frame = canvas.toDataURL("image/png")

    await generateCaption(frame, false) 
  }, frameInterval)
}

function stopCapturingFrames() {
  clearInterval(captureInterval)
}


onMounted(() => { initializeModel() })
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

  <div v-if="loading || error" class="overlay">
    <div class="card" style="width:30vw; background-color:#242424; text-align:center; padding:1rem;">
      <template v-if="loading && !error">
        <h3 style="color:white;">Loading Model...</h3>
        <progress_bar :progress="progress" />
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
        Use CPU
      </button>
      </router-link>
        </div>
    </template>
    </div>
  </div>

  <div class="main" style="display:flex; flex-direction: row; width:100%; gap:1rem; margin-top:1rem;">
    <div class="his_cardi" style="overflow-x: scroll; scrollbar-width: none; margin-right: 10px;">
      <input type="file" accept="image/*" @change="handleFile" />
      <input type="file" accept="video/*" @change="handleVideoFile" />
      <input v-model="imageUrl" placeholder="Enter image URL" />
      <button :disabled="!previewUrl" @click="generateCaption(previewUrl, true)">Generate Caption</button>
      <hr />
      <button @click="startWebcam">Start Webcam</button>
      <button @click="stopWebcam">Stop Webcam</button>
      <button :disabled="!videoActive" @click="startCapturingFrames">Start Live Caption</button>
      <button :disabled="!videoActive" @click="stopCapturingFrames">Stop Live Caption</button>
    </div>

    <div style="display:flex; flex-direction: column; width:75%; height:88vh;">
      <div class="card" style="flex:7; display:flex; justify-content:center; align-items:center; background:#1e1e1e;">
        <img v-if="previewUrl && !videoActive" :src="previewUrl" alt="Preview" style="object-fit:contain; max-width:100%; max-height:100%;" /> 
        <video v-show="videoActive" ref="videoRef" autoplay muted playsinline style="max-width:100%; max-height:100%; background:black;"></video>
     
      </div>
      <div class="card" style="flex:3; padding:0.5rem; background:#242424; color:white; overflow-y:auto;">
        <textarea v-model="customPrompt" placeholder="Custom prompt (optional)" style="width:100%; height:50px;"></textarea>
        <div v-if="generating">
  <div class="card">
    <h3>Generating caption...</h3>
    <p>Please wait</p>
  </div>
</div>
        <pre v-if="output">{{ output }}</pre>
      </div>
    </div>
  </div>
</template>
