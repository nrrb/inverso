<template>
  <div class="section" v-if="layer">
    <div class="section-header">
      <span>★ SELECTED LAYER</span>
      <div class="win-controls">
        <div class="win-btn">_</div>
        <div class="win-btn">□</div>
        <div class="win-btn">×</div>
      </div>
    </div>
    <div class="section-body">
      <!-- Content -->
      <div class="field">
        <label class="w95-label">TEXT CONTENT</label>
        <textarea class="w95-input" rows="3" :value="layer.content"
          @input="patch({ content: ($event.target as HTMLTextAreaElement).value })" />
      </div>

      <!-- Font family -->
      <div class="field">
        <label class="w95-label">FONT FAMILY</label>
        <select class="w95-input" :value="layer.fontFamily" @change="onFontChange">
          <option v-for="f in allFonts" :key="f.family" :value="f.family">{{ f.family }}</option>
        </select>
      </div>

      <!-- Font size + weight -->
      <div class="field-row">
        <div class="field">
          <label class="w95-label">SIZE (PX)</label>
          <input class="w95-input" type="number" min="6" max="800" step="1"
            :value="layer.fontSize" @change="patch({ fontSize: +($event.target as HTMLInputElement).value })" />
        </div>
        <div class="field">
          <label class="w95-label">WEIGHT</label>
          <select class="w95-input" :value="layer.fontWeight"
            @change="patch({ fontWeight: +($event.target as HTMLSelectElement).value })">
            <option v-for="w in availableWeights" :key="w" :value="w">{{ w }}</option>
          </select>
        </div>
      </div>

      <!-- Bold + Italic toggles -->
      <div class="field">
        <label class="w95-label">STYLE</label>
        <div class="toggle-row">
          <button class="toggle-btn" :class="{ active: isBold }" @click="toggleBold">B</button>
          <button class="toggle-btn" :class="{ active: layer.italic, disabled: !hasItalic }"
            @click="hasItalic && patch({ italic: !layer.italic })"
            :title="hasItalic ? '' : 'No italic variant for this font'">I</button>
        </div>
      </div>

      <!-- Alignment -->
      <div class="field">
        <label class="w95-label">ALIGNMENT</label>
        <div class="toggle-row">
          <button class="toggle-btn" :class="{ active: layer.align === 'left' }" @click="patch({ align: 'left' })">L</button>
          <button class="toggle-btn" :class="{ active: layer.align === 'center' }" @click="patch({ align: 'center' })">C</button>
          <button class="toggle-btn" :class="{ active: layer.align === 'right' }" @click="patch({ align: 'right' })">R</button>
        </div>
      </div>

      <!-- Letter spacing + Line height -->
      <div class="field-row">
        <div class="field">
          <label class="w95-label">LETTER SP.</label>
          <input class="w95-input" type="number" step="0.5" min="-10" max="50"
            :value="layer.letterSpacing" @change="patch({ letterSpacing: +($event.target as HTMLInputElement).value })" />
        </div>
        <div class="field">
          <label class="w95-label">LINE HT.</label>
          <input class="w95-input" type="number" step="0.05" min="0.5" max="4"
            :value="layer.lineHeight" @change="patch({ lineHeight: +($event.target as HTMLInputElement).value })" />
        </div>
      </div>

      <!-- Rotation -->
      <div class="field">
        <label class="w95-label">ROTATION (DEG)</label>
        <div class="slider-row">
          <input type="range" min="-180" max="180" step="1" :value="layer.rotation"
            @input="patch({ rotation: +($event.target as HTMLInputElement).value })"
            class="slider" />
          <input class="w95-input num-input" type="number" min="-180" max="180" step="1"
            :value="layer.rotation" @change="patch({ rotation: +($event.target as HTMLInputElement).value })" />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="no-selection">
    <div class="no-sel-text">~*~ SELECT A LAYER ~*~</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TextLayer, FontInfo } from '../types'
import { loadFont } from '../composables/useFontLoader'
import fonts from '../data/fonts.json'

const allFonts: FontInfo[] = fonts as FontInfo[]

const props = defineProps<{ layer: TextLayer | undefined }>()
const emit = defineEmits<{ (e: 'update', id: string, patch: Partial<TextLayer>): void }>()

function patch(p: Partial<TextLayer>) {
  if (props.layer) emit('update', props.layer.id, p)
}

async function onFontChange(e: Event) {
  const family = (e.target as HTMLSelectElement).value
  const f = allFonts.find((x) => x.family === family)
  if (!f) return
  await loadFont(f.family, f.variants)
  const nonItalic = f.variants.filter((v) => !v.includes('italic'))
  const currentW = String(props.layer?.fontWeight ?? 400)
  const w = nonItalic.includes(currentW) ? props.layer!.fontWeight : +nonItalic[0]
  patch({ fontFamily: f.family, fontWeight: w, italic: false })
}

const currentFont = computed(() => allFonts.find((f) => f.family === props.layer?.fontFamily))

const availableWeights = computed(() => {
  const f = currentFont.value
  if (!f) return [400]
  return f.variants
    .filter((v) => !v.includes('italic'))
    .map(Number)
    .sort((a, b) => a - b)
})

const hasItalic = computed(() =>
  currentFont.value?.variants.some((v) => v.includes('italic')) ?? false,
)

const isBold = computed(() => (props.layer?.fontWeight ?? 400) >= 700)

function toggleBold() {
  if (!props.layer) return
  const weights = availableWeights.value
  if (isBold.value) {
    const lighter = weights.filter((w) => w < 700)
    patch({ fontWeight: lighter.length ? lighter[lighter.length - 1] : 400 })
  } else {
    const bolder = weights.filter((w) => w >= 700)
    patch({ fontWeight: bolder.length ? bolder[0] : 700 })
  }
}
</script>

<style scoped>
.section { display: flex; flex-direction: column; }
.section-body {
  background: #ffffff;
  border: 2px inset #808080;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.field { display: flex; flex-direction: column; gap: 3px; flex: 1; }
.field-row { display: flex; gap: 8px; }
.toggle-row { display: flex; gap: 3px; }
.toggle-btn { flex: 1; }
.toggle-btn.disabled { opacity: 0.4; cursor: not-allowed; }
.slider-row { display: flex; align-items: center; gap: 6px; }
.slider { flex: 1; accent-color: #ff00ff; }
.num-input { width: 52px; flex-shrink: 0; }


.no-selection {
  background: #ffffcc;
  border: 2px inset #808080;
  padding: 16px 8px;
  text-align: center;
}
.no-sel-text {
  font-family: 'Comic Sans MS', cursive;
  font-size: 11px;
  color: #888888;
}
</style>
