<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/01383c3c-9a6c-447e-afe6-9c8d63ee97bb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Stable video export

The video button now uses deterministic off-line rendering in current Chrome
and Edge. Every React state is captured as a complete frame, receives an exact
WebCodecs timestamp, and is muxed into WebM. Rendering may take longer than the
selected 5 or 10 seconds, but the downloaded video remains fixed at 30 FPS.

CSS transitions are disabled only inside the artwork during export so that one
letter cannot lag behind another. Browsers without WebCodecs keep the original
MediaRecorder fallback.
