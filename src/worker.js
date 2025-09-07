
import { pipeline, TextStreamer, env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = false;

let generator = null;
let abortController = null;

self.onmessage = async (e) => {
  const { type, data } = e.data;

  try {
    if (type === "init") {
      const modelName = data.model;
      self.postMessage({ type: "loading" });


      generator = await pipeline("text-generation", modelName, {
        progress_callback: (info) => {
          if (info.progress !== undefined) {
            self.postMessage({ type: "progress", progress: Math.round(info.progress) });
          }
        },
      });

      self.postMessage({ type: "ready" });
    }

    if (type === "generate") {
      if (!generator) {
        self.postMessage({ type: "error", message: "Model not initialized" });
        return;
      }

      const text = data.text;
      abortController = new AbortController();
      const signal = abortController.signal;

      let reply = "";

      const streamer = new TextStreamer(generator.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (token) => {
          if (signal.aborted) throw new Error("Generation aborted");
          reply += token;
          self.postMessage({ type: "token", full: reply });
        },
      });

      try {
        await generator(text, {
          max_new_tokens: 256,
          temperature: 0.8,
          streamer,
        });
        self.postMessage({ type: "done" });
      } catch (err) {
        if (err.message === "Generation aborted") {
          self.postMessage({ type: "stopped" });
        } else {
          self.postMessage({ type: "error", message: err.message });
        }
      }
    }

    if (type === "stop") {
      if (abortController) {
        abortController.abort();
      }
    }
  } catch (err) {
    self.postMessage({ type: "error", message: err.message });
  }
};
