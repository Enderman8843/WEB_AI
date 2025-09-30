import {
  AutoProcessor,
  AutoModelForImageTextToText,
  load_image,
  TextStreamer
} from "@huggingface/transformers";

let processor = null;
let model = null;
let isModelLoaded = false;
let modelMode = "webgpu";

async function initializeModel(mode) {
  console.log(mode)
  if (isModelLoaded) return;

  modelMode = mode 

  postMessage({ type: "progress", text: "Loading processor...", tokens: 20 });
  processor = await AutoProcessor.from_pretrained("onnx-community/FastVLM-0.5B-ONNX");

  postMessage({ type: "progress", text: "Loading model...", tokens: 60 });
  model = await AutoModelForImageTextToText.from_pretrained(
    "onnx-community/FastVLM-0.5B-ONNX",
    {
      device: mode, 
  
    }
  );

  isModelLoaded = true;
  postMessage({ type: "ready" });
}

onmessage = async (e) => {
  const { type, mode, url, prompt } = e.data;

  if (type === "init") {
    await initializeModel(mode);
  }

  if (type === "caption") {
    try {
      await initializeModel(modelMode);

      const messages = [{ role: "user", content: `<image>${prompt}` }];
      const chatPrompt = processor.apply_chat_template(messages, { add_generation_prompt: true });

      const image = await load_image(url);
      const inputs = await processor(image, chatPrompt, { add_special_tokens: false });

      let caption = "";
      const streamer = new TextStreamer(processor.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: false,
        callback_function: text => {
          caption += text;
          postMessage({ type: "progress", text: caption }); 
        }
      });

      await model.generate({
        ...inputs,
        max_new_tokens: 512,
        do_sample: false,
        streamer
      });

      postMessage({ type: "caption", text: caption });
    } catch (err) {
      postMessage({ type: "error", error: err.message });
    }
  }
};
