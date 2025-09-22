<script setup>
import 'material-icons/iconfont/material-icons.css'
import sys from './components/sys_stats.vue'
import progress_bar from './components/progress_bar.vue'
import { ref, onMounted } from 'vue'
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
const currentDevice = ref("webgpu") 
const imageUrl = ref("")
const previewUrl = ref("")
const customPrompt = ref("")
const output = ref("")
const loading = ref(false)
const loadingText = ref("")
const progress = ref(0) 
const error = ref("")

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
      device: "webgpu",
      dtype: { embed_tokens:"fp16", vision_encoder:"q4", decoder_model_merged:"q4" }
    })

    isModelLoaded.value = true
    clearLoading()
  } catch(err) {
    console.error("Model load failed:", err)
    setError("Failed to load model. Please try again.")
    clearLoading()
  }
}

async function generateCaption(url) {
  try {
    clearError()
    setLoading("Processing image...", 50)
    if (!isModelLoaded.value) await initializeModel()
    if (!processor.value) throw new Error("Processor not loaded")
 
    const promptText = customPrompt.value.trim() || "Describe this image in detail."
    const messages = [{ role:"user", content:`<image>${promptText}` }]
    const prompt = processor.value.apply_chat_template(messages, { add_generation_prompt:true })

    setLoading("Loading image...", 70)
    const image = await load_image(url)

    setLoading("Processing inputs...", 80)
    const inputs = await processor.value(image, prompt, { add_special_tokens:false })

    setLoading("Generating caption...", 90)
    output.value = ""

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

    clearLoading()
  } catch(err) {
    console.error("Caption error:", err)
    setError(err)
    clearLoading()
  }
}


function handleFile(e) {
  const file = e.target.files[0]
  if(!file || !file.type.startsWith("image/")) return setError("Please upload a valid image file.")
  const url = URL.createObjectURL(file)
  previewUrl.value = url
  imageUrl.value = url
}

onMounted(() => { initializeModel() })
</script>

<template>
  <header
    style="display:flex; flex-direction: row; border-radius: 13px; border-width: 2px; border-color: white; border-style: solid; color: white; padding:0.5rem;"
  >
    <a style="font-family:Noto Sans, sans-serif; font-weight:600; font-size: larger; margin:0.2rem">Lanthanum.AI</a>
    <div style="width:95%; display:flex; justify-content:flex-end; gap:0.5rem;">
      <button class="btn-ic" @click="toggleSystemInfo">
        <span class="material-icons">computer</span>Stats
      </button>
    </div>
  </header>

  
  <div v-if="showSystemPopup" class="overlay">
    <sys></sys>
  </div>

  
  <div v-if="loading || error" class="overlay">
    <div class="card" style="width:30vw; background-color:#242424; text-align:center; padding:1rem;">
      <template v-if="loading && !error">
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
      <input v-model="imageUrl" placeholder="Enter image URL" />
      <button :disabled="!previewUrl" @click="generateCaption(previewUrl)">Generate Caption</button>
    </div>

    
    <div style="display:flex; flex-direction: column; width:75%; height:88vh;">
      <div class="card" style="flex:3; display:flex; justify-content:center; align-items:center; background:#1e1e1e;">
        <img v-if="previewUrl" :src="previewUrl" alt="Preview" style="max-width:100%; max-height:100%;" />
        <span v-else style="color:gray;">No Image Loaded</span>
      </div>
      <div class="card" style="flex:1; padding:0.5rem; background:#242424; color:white; overflow-y:auto;">
        <textarea v-model="customPrompt" placeholder="Custom prompt (optional)" style="width:100%; height:50px;"></textarea>
        <pre v-if="output">{{ output }}</pre>
      </div>
    </div>
  </div>
</template>
