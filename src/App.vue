<template>
  <div class="app-shell">
    <!-- Marquee -->
    <div class="marquee-bar">
      <div class="marquee-inner">
        ★彡 WELCOME TO INVERSO™ ::: WHAT EVEN IS COLOR :::
        <em class="blink">NEW!!</em> PIXEL-LEVEL COLOR INVERSION :::
        BEST VIEWED IN NETSCAPE NAVIGATOR 4.7 :::
        ★彡 注意 危険 :::
        SIGN MY GUESTBOOK :::
        彡★ INVERSO™ MAKES YOUR TEXT INVERT PIXEL BY PIXEL :::
        <em class="blink">HOT!!</em> DTG READY :::
        彡★ WELCOME TO INVERSO™ ★彡
      </div>
    </div>

    <!-- Header -->
    <header class="site-header">
      <div class="corner-spin cw">⚙</div>
      <div class="header-center">
        <div class="site-title">INVERSO™</div>
        <div class="tagline blink">~*~ what even is color ~*~</div>
      </div>
      <div class="corner-spin ccw">★</div>
    </header>

    <!-- Main -->
    <div class="main-area">
      <CanvasViewport
        :state="appState"
        :sourceImageData="sourceImageData"
        @image-loaded="onImageLoaded"
        @layer-added="onLayerAdded"
        @layer-updated="onLayerUpdated"
        @select="onSelect"
        @silly-modal="onSillyModal"
      />
      <SettingsDrawer
        :state="appState"
        @update:transparentBgColor="appState.transparentBgColor = $event"
        @update:inversionMode="appState.inversionMode = $event"
        @select="onSelect"
        @delete-layer="onDeleteLayer"
        @move-up="onMoveUp"
        @move-down="onMoveDown"
        @toggle-add="appState.addingText = !appState.addingText"
        @update-layer="onLayerUpdated"
        @export="onExport"
      />
    </div>

    <!-- Silly Modal -->
    <div v-if="modal.visible" class="modal-backdrop" @click.self="modal.visible = false">
      <div class="modal-candy-outer">
        <div class="modal-candy-inner">
          <div class="modal-title">{{ modal.title }}</div>
          <div class="modal-body">{{ modal.body }}</div>
          <button class="modal-ok-btn" @click="modal.visible = false">Yay!!!1</button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="site-footer">
      <span class="visitor-counter">VISITORS: 69420</span>
      &nbsp;★&nbsp;
      <a href="#" class="guestbook-link" @click.prevent="signGuestbook">SIGN MY GUESTBOOK</a>
      &nbsp;★&nbsp;
      <span>POWERED BY LOVE &amp; HOPE</span>
      &nbsp;★&nbsp;
      <span class="muted-audio" title="🎵 MIDI not included">🔇</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { AppState, TextLayer } from './types'
import CanvasViewport from './components/CanvasViewport.vue'
import SettingsDrawer from './components/SettingsDrawer.vue'
import { exportPNG } from './composables/useInversion'

const ADJS = ['flamboyant','crusty','vibrational','aquatic','gaseous','sentient','moldy',
               'whimsical','suburban','glittering','confused','bureaucratic','magnetic',
               'disco','tangled','lukewarm','crunchy','existential','pointy','aerodynamic']
const ANIMALS = ['capybara','axolotl','blobfish','narwhal','quokka','pangolin',
                 'platypus','tardigrade','wombat','nudibranch','binturong','aye-aye',
                 'kakapo','fossa','blobfish']
const EMOJIS = ['🐾','🌟','💫','✨','🎪','🎨','🦄','🌈','🎭','💝','🫧','🪸','🐸','🫠','🧿']

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

const modal = reactive({ visible: false, title: '', body: '' })

function showModal(title: string, body: string) {
  modal.title = title
  modal.body = body
  modal.visible = true
}

function signGuestbook() {
  const name = `${pick(ADJS)} ${pick(ADJS)} ${pick(ANIMALS)} ${pick(EMOJIS)}`
  showModal('✍️ GUESTBOOK ✍️', `Signed,\n${name}`)
}

function onSillyModal(payload: { title: string; body: string }) {
  showModal(payload.title, payload.body)
}

const appState = reactive<AppState>({
  sourceImage: null,
  sourceWidth: 0,
  sourceHeight: 0,
  transparentBgColor: '#000000',
  inversionMode: 'rgb',
  textLayers: [],
  selectedLayerId: null,
  addingText: false,
})

const sourceImageData = ref<ImageData | null>(null)

function onImageLoaded(img: ImageBitmap, w: number, h: number, data: ImageData) {
  appState.sourceImage = img
  appState.sourceWidth = w
  appState.sourceHeight = h
  sourceImageData.value = data
  appState.textLayers = []
  appState.selectedLayerId = null
  appState.addingText = false
}

function onLayerAdded(layer: TextLayer) {
  appState.textLayers.push(layer)
  appState.selectedLayerId = layer.id
  appState.addingText = false
}

function onLayerUpdated(id: string, patch: Partial<TextLayer>) {
  const layer = appState.textLayers.find((l) => l.id === id)
  if (layer) Object.assign(layer, patch)
}

function onSelect(id: string | null) {
  appState.selectedLayerId = id
}

function onDeleteLayer(id: string) {
  const idx = appState.textLayers.findIndex((l) => l.id === id)
  if (idx !== -1) appState.textLayers.splice(idx, 1)
  if (appState.selectedLayerId === id) appState.selectedLayerId = null
}

function onMoveUp(id: string) {
  const idx = appState.textLayers.findIndex((l) => l.id === id)
  if (idx > 0) {
    const tmp = appState.textLayers[idx - 1]
    appState.textLayers[idx - 1] = appState.textLayers[idx]
    appState.textLayers[idx] = tmp
  }
}

function onMoveDown(id: string) {
  const idx = appState.textLayers.findIndex((l) => l.id === id)
  if (idx < appState.textLayers.length - 1) {
    const tmp = appState.textLayers[idx + 1]
    appState.textLayers[idx + 1] = appState.textLayers[idx]
    appState.textLayers[idx] = tmp
  }
}

async function onExport() {
  if (!appState.sourceImage || !sourceImageData.value) return
  await exportPNG(appState, sourceImageData.value)
}
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 16px);
  background: #000000;
  border: 6px ridge #ff00ff;
}

/* ── Marquee ── */
.marquee-bar {
  height: 26px;
  background: #000000;
  border: 3px outset #00ff00;
  overflow: hidden;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.marquee-inner {
  white-space: nowrap;
  font-family: 'Tahoma', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #ffff00;
  text-transform: uppercase;
  animation: marquee 22s linear infinite;
  display: inline-block;
  padding-left: 100%;
}
.blink {
  font-style: normal;
  color: #ff0000;
  animation: blink 0.9s infinite;
}

/* ── Header ── */
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: linear-gradient(90deg, #ff00ff, #00ffff, #ffff00, #ff0000, #ff00ff);
  background-size: 200% 100%;
  animation: rainbow 4s linear infinite;
  border: 4px outset #ffffff;
  flex-shrink: 0;
}
.site-title {
  font-family: 'Impact', 'Arial Black', sans-serif;
  font-size: 38px;
  color: #ffffff;
  transform: skewX(-5deg);
  text-shadow: 3px 3px 0 #000, 6px 6px 0 #ff00ff, -2px -2px 0 #00ffff;
  letter-spacing: -1px;
  line-height: 1;
}
.header-center {
  text-align: center;
}
.tagline {
  font-family: 'Comic Sans MS', 'Chalkboard SE', cursive;
  font-size: 14px;
  color: #ffffff;
  text-shadow: 1px 1px 0 #000;
}
.corner-spin {
  font-size: 26px;
  color: #ffffff;
  text-shadow: 1px 1px 0 #000;
}
.corner-spin.cw  { animation: spin-cw  3s linear infinite; display: inline-block; }
.corner-spin.ccw { animation: spin-ccw 3s linear infinite; display: inline-block; }

/* ── Main ── */
.main-area {
  display: flex;
  flex: 1;
  gap: 6px;
  padding: 6px;
  min-height: 0;
  background: #222222;
}

/* ── Footer ── */
.site-footer {
  background: #000000;
  border: 2px ridge #ff00ff;
  padding: 6px;
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  color: #ffffff;
  text-align: center;
  flex-shrink: 0;
}
.visitor-counter {
  font-family: 'Courier New', monospace;
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 1px 6px;
  font-weight: 700;
  letter-spacing: 2px;
}
.guestbook-link {
  text-decoration: underline;
  cursor: pointer;
  animation: flicker 0.4s infinite;
}
.guestbook-link:hover { text-decoration: none; }
.muted-audio { cursor: default; }

/* ── Silly Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-candy-outer {
  padding: 10px;
  background: repeating-linear-gradient(
    45deg,
    #ff0000 0px, #ff0000 12px,
    #ffffff 12px, #ffffff 24px
  );
  box-shadow: 0 0 0 4px #ffffff, 0 0 0 8px #cc0000, 0 8px 32px rgba(0,0,0,0.6);
}
.modal-candy-inner {
  background: #fffde7;
  padding: 28px 32px 24px;
  min-width: 300px;
  max-width: 380px;
  text-align: center;
  border: 3px inset #ccaa00;
}
.modal-title {
  font-family: 'Impact', 'Arial Black', sans-serif;
  font-size: 22px;
  color: #cc0000;
  margin-bottom: 14px;
  letter-spacing: 1px;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.15);
}
.modal-body {
  font-family: 'Comic Sans MS', 'Chalkboard SE', cursive;
  font-size: 15px;
  color: #333;
  margin-bottom: 22px;
  line-height: 1.6;
  white-space: pre-line;
}
.modal-ok-btn {
  background: linear-gradient(180deg, #ff6600, #cc3300);
  color: #ffff00;
  border: 4px outset #ff8844;
  font-family: 'Impact', 'Arial Black', sans-serif;
  font-size: 20px;
  padding: 8px 28px;
  cursor: pointer;
  letter-spacing: 2px;
  text-shadow: 1px 1px 0 #000;
  animation: modal-pulse 0.8s ease-in-out infinite;
}
.modal-ok-btn:hover { background: linear-gradient(180deg, #ff8800, #ee4400); }
.modal-ok-btn:active { border-style: inset; }
@keyframes modal-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
</style>
