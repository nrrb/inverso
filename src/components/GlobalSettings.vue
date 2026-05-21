<template>
  <div class="section">
    <div class="section-header">
      <span>★ GLOBAL SETTINGS</span>
      <div class="win-controls">
        <div class="win-btn">_</div>
        <div class="win-btn">□</div>
        <div class="win-btn">×</div>
      </div>
    </div>
    <div class="section-body">
      <div class="field">
        <label class="w95-label">TRANSPARENT BG COLOR</label>
        <div class="color-row">
          <div class="swatch bevel-in" :style="{ background: modelValue.transparentBgColor }" @click="colorInput?.click()" />
          <input class="w95-input hex-input" type="text" :value="modelValue.transparentBgColor"
            @input="e => emit('update:transparentBgColor', (e.target as HTMLInputElement).value)" />
          <input ref="colorInput" type="color" :value="modelValue.transparentBgColor"
            @input="e => emit('update:transparentBgColor', (e.target as HTMLInputElement).value)"
            style="visibility:hidden;width:0;height:0;position:absolute;" />
        </div>
      </div>
      <div class="field">
        <label class="w95-label">INVERSION MODE</label>
        <div class="toggle-row">
          <button class="toggle-btn" :class="{ active: modelValue.inversionMode === 'rgb' }"
            @click="emit('update:inversionMode', 'rgb')">RGB</button>
          <button class="toggle-btn" :class="{ active: modelValue.inversionMode === 'luminance' }"
            @click="emit('update:inversionMode', 'luminance')">LUMA</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AppState } from '../types'

const props = defineProps<{
  modelValue: Pick<AppState, 'transparentBgColor' | 'inversionMode'>
}>()
const emit = defineEmits<{
  (e: 'update:transparentBgColor', v: string): void
  (e: 'update:inversionMode', v: 'rgb' | 'luminance'): void
}>()

const colorInput = ref<HTMLInputElement | null>(null)
</script>

<style scoped>
.section { display: flex; flex-direction: column; }
.section-body { background: #ffffff; border: 2px inset #808080; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
.field { display: flex; flex-direction: column; gap: 3px; }
.color-row { display: flex; align-items: center; gap: 6px; }
.swatch { width: 24px; height: 24px; flex-shrink: 0; cursor: pointer; }
.hex-input { flex: 1; font-family: 'Courier New', monospace; font-size: 11px; }
.toggle-row { display: flex; gap: 4px; }
.toggle-btn { flex: 1; }
</style>
