import {
  AutoProcessor,
  AutoModelForImageTextToText,
  load_image,
  TextStreamer
} from "@huggingface/transformers";

let processor = null;
let model = null;
let isModelLoaded = false;

async function initializeModel() {
  if (isModelLoaded) return;

  try {
    postMessage({ type: "progress", text: "Loading processor...", tokens: 20 });
    processor = await AutoProcessor.from_pretrained(
      "sefaburak/dinov2-small-onnx"
    );
  } catch (err) {
    postMessage({ type: "error", error: `Processor load failed: ${err.message}` });
    throw err;
  }

  postMessage({ type: "progress", text: "Loading model...", tokens: 60 });
  try {
  
    model = await AutoModelForImageTextToText.from_pretrained(
      "sefaburak/dinov2-small-onnx",
      {
        device: "wasm",       
        dtype: "fp32"         
      }
    );
  } catch (err) {
    postMessage({ type: "error", error: `Model load failed: ${err.message}` });
    throw err;
  }

  isModelLoaded = true;
  postMessage({ type: "ready" });
}

onmessage = async (e) => {
  const { type, url } = e.data;

  if (type === "init") {
    try {
      await initializeModel();
    } catch (err) {}
  }

  if (type === "extract") {
    try {
      await initializeModel();

      const image = await load_image(url);
      const inputs = await processor(image, { return_tensors: "np" });

      let features = null;

      
      features = await model.generate({
        ...inputs,
        max_new_tokens: 0 
      });

  
      const featureArray = processor.tokenizer.decode(features[0], { skip_special_tokens: true });

      postMessage({ type: "features", data: featureArray });

    } catch (err) {
      postMessage({ type: "error", error: `Feature extraction failed: ${err.message}` });
    }
  }
};
