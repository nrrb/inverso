<template>
  <div class="canvas-area">
    <div class="canvas-frame" ref="frameRef">
      <!-- Drop zone / empty state -->
      <div v-if="!state.sourceImage" class="drop-zone"
        @dragover.prevent="draggingFile = true"
        @dragleave="draggingFile = false"
        @drop.prevent="onFileDrop"
        :class="{ dragover: draggingFile }"
        @click="fileInput?.click()"
      >
        <div class="drop-text">DROP A .PNG OR .JPG<br>OR DIE TRYING</div>
        <div class="drop-sub">click to browse</div>
      </div>

      <!-- Canvas stack — fills entire frame so you can draw outside image bounds -->
      <div v-else class="canvas-container"
        :class="{ 'cursor-crosshair': state.addingText, 'cursor-move': isDraggingLayer }"
      >
        <canvas ref="canvasRef"
          :width="canvasW" :height="canvasH"
          @mousedown="onMouseDown"
          style="display:block; position:absolute; top:0; left:0; width:100%; height:100%;"
        />
        <!-- Selection overlay (HTML, not canvas) -->
        <div v-if="selectedLayer"
          class="selection-overlay"
          :style="overlayStyle"
          @mousedown.stop
        >
          <div class="handle nw" @mousedown.stop="startResize('nw', $event)" />
          <div class="handle ne" @mousedown.stop="startResize('ne', $event)" />
          <div class="handle sw" @mousedown.stop="startResize('sw', $event)" />
          <div class="handle se" @mousedown.stop="startResize('se', $event)" />
          <div class="handle n"  @mousedown.stop="startResize('n',  $event)" />
          <div class="handle s"  @mousedown.stop="startResize('s',  $event)" />
          <div class="handle e"  @mousedown.stop="startResize('e',  $event)" />
          <div class="handle w"  @mousedown.stop="startResize('w',  $event)" />
        </div>
        <!-- Creating preview rect -->
        <div v-if="drag.type === 'creating'" class="creating-rect" :style="creatingStyle" />
      </div>
    </div>

    <!-- Canvas decorations -->
    <div class="sticker sticker-fire" @click="onFireClick">🔥</div>
    <div class="sticker sticker-money" @click="onMoneyClick">💰</div>
    <div class="new-badge" @click="onNewClick">NEW!!</div>

    <input ref="fileInput" type="file" accept="image/png,image/jpeg" style="display:none" @change="onFileInput" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { AppState, TextLayer, DragState, Handle } from '../types'
import { renderAll } from '../composables/useInversion'

const props = defineProps<{ state: AppState; sourceImageData: ImageData | null }>()
const emit = defineEmits<{
  (e: 'image-loaded', img: ImageBitmap, w: number, h: number, data: ImageData): void
  (e: 'layer-added', layer: TextLayer): void
  (e: 'layer-updated', id: string, patch: Partial<TextLayer>): void
  (e: 'select', id: string | null): void
  (e: 'silly-modal', payload: { title: string; body: string }): void
}>()

function onFireClick() {
  emit('silly-modal', {
    title: '🔥 FIRE DETECTED 🔥',
    body: 'A DECORATIVE FIRE HAS BEEN DETECTED IN YOUR VICINITY.\n\nThe fire is vibing. Do not extinguish. Do not contact emergency services.\n\nThe fire sends its regards.',
  })
}

function onMoneyClick() {
  emit('silly-modal', {
    title: '💰 FINANCIAL UPDATE 💰',
    body: 'You have located a JPEG of a money bag.\n\nThis JPEG has a certified street value of $0.00. It cannot be withdrawn from an ATM. The bag has feelings. Please do not spend it.',
  })
}

function onNewClick() {
  emit('silly-modal', {
    title: '★ NEW FEATURE ALERT ★',
    body: 'This feature has been NEW!! since 1998.\n\nIt was also NEW!! in 2003, 2011, and last Tuesday. The newness is eternal. Scientists are baffled. Please remain excited.',
  })
}

const frameRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const draggingFile = ref(false)

// Image display size (50% of constraining dimension)
const displayW = ref(300)
const displayH = ref(300)
// Full canvas fills the frame
const canvasW = ref(600)
const canvasH = ref(600)
// Image offset within canvas (centers the image)
const imgOffX = ref(0)
const imgOffY = ref(0)

const displayScale = computed(() => {
  if (!props.state.sourceImage) return 1
  return displayW.value / props.state.sourceWidth
})

const drag = reactive<DragState>({ type: 'none', startX: 0, startY: 0 })

const isDraggingLayer = computed(() => drag.type === 'moving' || drag.type === 'resizing')

const selectedLayer = computed<TextLayer | undefined>(() =>
  props.state.textLayers.find((l) => l.id === props.state.selectedLayerId),
)

const overlayStyle = computed(() => {
  if (!selectedLayer.value) return {}
  const l = selectedLayer.value
  const s = displayScale.value
  const cx = imgOffX.value + (l.x + l.width / 2) * s
  const cy = imgOffY.value + (l.y + l.height / 2) * s
  return {
    position: 'absolute' as const,
    left: cx + 'px',
    top: cy + 'px',
    width: l.width * s + 'px',
    height: l.height * s + 'px',
    transform: `translate(-50%, -50%) rotate(${l.rotation}deg)`,
    pointerEvents: 'none' as const,
  }
})


const creatingStyle = computed(() => {
  if (drag.type !== 'creating') return {}
  const x1 = Math.min(drag.startX, drag.startX + (drag.origW ?? 0))
  const y1 = Math.min(drag.startY, drag.startY + (drag.origH ?? 0))
  const w = Math.abs(drag.origW ?? 0)
  const h = Math.abs(drag.origH ?? 0)
  return {
    position: 'absolute' as const,
    left: x1 + 'px',
    top: y1 + 'px',
    width: w + 'px',
    height: h + 'px',
  }
})

function toNative(screenX: number, screenY: number): [number, number] {
  const s = displayScale.value
  return [(screenX - imgOffX.value) / s, (screenY - imgOffY.value) / s]
}

function canvasCoords(e: MouseEvent): [number, number] {
  const rect = canvasRef.value!.getBoundingClientRect()
  return [e.clientX - rect.left, e.clientY - rect.top]
}

function hitTestLayer(sx: number, sy: number): string | null {
  const [nx, ny] = toNative(sx, sy)
  for (let i = props.state.textLayers.length - 1; i >= 0; i--) {
    const l = props.state.textLayers[i]
    if (nx >= l.x && nx <= l.x + l.width && ny >= l.y && ny <= l.y + l.height) {
      return l.id
    }
  }
  return null
}

function beginWindowDrag() {
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
}

function endWindowDrag() {
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
}

function onMouseDown(e: MouseEvent) {
  const [sx, sy] = canvasCoords(e)

  if (props.state.addingText) {
    drag.type = 'creating'
    drag.startX = sx
    drag.startY = sy
    drag.origW = 0
    drag.origH = 0
    beginWindowDrag()
    return
  }

  const hit = hitTestLayer(sx, sy)
  if (hit) {
    emit('select', hit)
    const l = props.state.textLayers.find((x) => x.id === hit)!
    drag.type = 'moving'
    drag.startX = sx
    drag.startY = sy
    drag.layerId = hit
    drag.origX = l.x
    drag.origY = l.y
    beginWindowDrag()
  } else {
    emit('select', null)
  }
}

function startResize(handle: Handle, e: MouseEvent) {
  if (!selectedLayer.value) return
  const [sx, sy] = canvasCoords(e)
  drag.type = 'resizing'
  drag.handle = handle
  drag.startX = sx
  drag.startY = sy
  drag.layerId = selectedLayer.value.id
  drag.origX = selectedLayer.value.x
  drag.origY = selectedLayer.value.y
  drag.origW = selectedLayer.value.width
  drag.origH = selectedLayer.value.height
  e.preventDefault()
  beginWindowDrag()
}

function onWindowMouseMove(e: MouseEvent) {
  if (drag.type === 'none') return
  const [sx, sy] = canvasCoords(e)
  const dx = sx - drag.startX
  const dy = sy - drag.startY
  const ndx = dx / displayScale.value
  const ndy = dy / displayScale.value

  if (drag.type === 'creating') {
    drag.origW = dx
    drag.origH = dy
    return
  }

  if (drag.type === 'moving' && drag.layerId) {
    emit('layer-updated', drag.layerId, {
      x: (drag.origX ?? 0) + ndx,
      y: (drag.origY ?? 0) + ndy,
    })
    return
  }

  if (drag.type === 'resizing' && drag.layerId && drag.handle) {
    const h = drag.handle
    const ox = drag.origX!
    const oy = drag.origY!
    const ow = drag.origW!
    const oh = drag.origH!
    let nx = ox, ny = oy, nw = ow, nh = oh

    if (h === 'se') { nw = Math.max(20, ow + ndx); nh = Math.max(10, oh + ndy) }
    else if (h === 'sw') { nx = ox + ndx; nw = Math.max(20, ow - ndx); nh = Math.max(10, oh + ndy) }
    else if (h === 'ne') { ny = oy + ndy; nw = Math.max(20, ow + ndx); nh = Math.max(10, oh - ndy) }
    else if (h === 'nw') { nx = ox + ndx; ny = oy + ndy; nw = Math.max(20, ow - ndx); nh = Math.max(10, oh - ndy) }
    else if (h === 'e')  { nw = Math.max(20, ow + ndx) }
    else if (h === 'w')  { nx = ox + ndx; nw = Math.max(20, ow - ndx) }
    else if (h === 's')  { nh = Math.max(10, oh + ndy) }
    else if (h === 'n')  { ny = oy + ndy; nh = Math.max(10, oh - ndy) }

    emit('layer-updated', drag.layerId, { x: nx, y: ny, width: nw, height: nh })
  }
}

function onWindowMouseUp(e: MouseEvent) {
  if (drag.type === 'creating') {
    const [sx, sy] = canvasCoords(e)
    const rawW = sx - drag.startX
    const rawH = sy - drag.startY
    const x = Math.min(drag.startX, sx)
    const y = Math.min(drag.startY, sy)
    const w = Math.abs(rawW)
    const h = Math.abs(rawH)

    if (w > 20 && h > 10) {
      const [nx, ny] = toNative(x, y)
      const [nw, nh] = [w / displayScale.value, h / displayScale.value]
      const newLayer: TextLayer = {
        id: crypto.randomUUID(),
        content: 'TYPE HERE',
        x: nx, y: ny, width: nw, height: nh,
        rotation: 0,
        fontFamily: 'Bebas Neue',
        fontSize: Math.min(72, Math.round(nh * 0.6)),
        fontWeight: 400,
        italic: false,
        letterSpacing: 0,
        lineHeight: 1.2,
        align: 'left',
      }
      emit('layer-added', newLayer)
    }
  }
  drag.type = 'none'
  endWindowDrag()
}

// ── File handling ──
async function loadFile(file: File) {
  if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
    alert("THAT AIN'T A PNG OR JPG, FRIEND ☹")
    return
  }
  const bitmap = await createImageBitmap(file)
  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = bitmap.width
  tmpCanvas.height = bitmap.height
  const tmpCtx = tmpCanvas.getContext('2d')!
  tmpCtx.drawImage(bitmap, 0, 0)
  const imgData = tmpCtx.getImageData(0, 0, bitmap.width, bitmap.height)
  emit('image-loaded', bitmap, bitmap.width, bitmap.height, imgData)
}

function onFileDrop(e: DragEvent) {
  draggingFile.value = false
  const file = e.dataTransfer?.files[0]
  if (file) loadFile(file)
}
function onFileInput(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadFile(file)
}

// ── Rendering ──
let rafId = 0
let dirty = true

function scheduleRender() { dirty = true }

watch(() => [props.state, props.sourceImageData], scheduleRender, { deep: true })

function renderLoop() {
  if (dirty && canvasRef.value && props.state.sourceImage) {
    const ctx = canvasRef.value.getContext('2d')!
    renderAll(ctx, props.state, displayScale.value, props.sourceImageData, canvasW.value, canvasH.value, imgOffX.value, imgOffY.value)
    dirty = false
  }
  rafId = requestAnimationFrame(renderLoop)
}

// ── Resize observer ──
let ro: ResizeObserver | null = null

function updateSize() {
  if (!frameRef.value) return
  canvasW.value = frameRef.value.clientWidth
  canvasH.value = frameRef.value.clientHeight
  if (!props.state.sourceImage) return
  const maxW = canvasW.value * 0.5
  const maxH = canvasH.value * 0.5
  const aspect = props.state.sourceWidth / props.state.sourceHeight
  let w = maxW
  let h = w / aspect
  if (h > maxH) { h = maxH; w = h * aspect }
  displayW.value = Math.floor(w)
  displayH.value = Math.floor(h)
  imgOffX.value = Math.floor((canvasW.value - displayW.value) / 2)
  imgOffY.value = Math.floor((canvasH.value - displayH.value) / 2)
  dirty = true
}

watch(() => props.state.sourceImage, () => nextTick(updateSize))

onMounted(() => {
  ro = new ResizeObserver(updateSize)
  if (frameRef.value) ro.observe(frameRef.value)
  rafId = requestAnimationFrame(renderLoop)
})
onUnmounted(() => {
  ro?.disconnect()
  cancelAnimationFrame(rafId)
  endWindowDrag()
})

// Handle delete key
function onKeyDown(e: KeyboardEvent) {
  if ((e.key === 'Delete' || e.key === 'Backspace') && props.state.selectedLayerId) {
    if ((e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).tagName !== 'INPUT') {
      e.preventDefault()
    }
  }
}
onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<style scoped>
.canvas-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  background: radial-gradient(ellipse at center, #ffffff 0%, #ffccee 100%);
  border: 4px inset #00ffff;
  overflow: hidden;
}

.canvas-frame {
  flex: 1;
  position: relative;
  min-height: 460px;
}

.canvas-container {
  position: absolute;
  inset: 0;
  background: transparent;
}

.cursor-crosshair { cursor: crosshair; }
.cursor-move canvas { cursor: move; }

.drop-zone {
  width: 340px;
  height: 340px;
  border: 3px dashed #ff00ff;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.1s;
}
.drop-zone.dragover { border-color: #00ff00; background: #001100; }
.drop-text {
  font-family: 'Impact', 'Arial Black', sans-serif;
  font-size: 28px;
  color: #ffffff;
  text-align: center;
  line-height: 1.1;
  text-shadow: 2px 2px 0 #ff00ff, -1px -1px 0 #00ffff;
}
.drop-sub {
  font-family: 'Comic Sans MS', cursive;
  font-size: 12px;
  color: #aaaaaa;
  margin-top: 10px;
}

/* Selection overlay */
.selection-overlay {
  pointer-events: none;
  border: 2px dashed #ffff00;
  position: absolute;
}
.handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #ffff00;
  border: 2px solid #ff00ff;
  pointer-events: all;
  cursor: nwse-resize;
}
.handle.nw { top: -6px; left: -6px; cursor: nw-resize; }
.handle.ne { top: -6px; right: -6px; cursor: ne-resize; }
.handle.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
.handle.se { bottom: -6px; right: -6px; cursor: se-resize; }
.handle.n  { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.handle.s  { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.handle.e  { right: -6px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
.handle.w  { left: -6px; top: 50%; transform: translateY(-50%); cursor: w-resize; }

.creating-rect {
  pointer-events: none;
  border: 2px dashed #00ff00;
  background: rgba(0,255,0,0.05);
  position: absolute;
}

/* Stickers */
.sticker {
  position: absolute;
  font-size: 32px;
  pointer-events: auto;
  z-index: 10;
  user-select: none;
  cursor: pointer;
}
.sticker-fire {
  top: 14px;
  left: 14px;
  animation: wobble 0.6s ease-in-out infinite;
}
.sticker-money {
  bottom: 14px;
  right: 14px;
  animation: pulse 1s ease-in-out infinite;
}
.new-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff0000;
  color: #ffff00;
  font-family: 'Impact', 'Arial Black', sans-serif;
  font-size: 14px;
  padding: 4px 8px;
  border: 2px solid #ffffff;
  transform: rotate(15deg);
  animation: pulse 0.8s ease-in-out infinite;
  pointer-events: auto;
  z-index: 10;
  cursor: pointer;
  user-select: none;
}
</style>
