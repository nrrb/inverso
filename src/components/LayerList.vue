<template>
  <div class="section">
    <div class="section-header">
      <span>★ TEXT LAYERS</span>
      <div class="win-controls">
        <div class="win-btn">_</div>
        <div class="win-btn">□</div>
        <div class="win-btn">×</div>
      </div>
    </div>
    <div class="section-body">
      <div v-if="layers.length === 0" class="empty">~no layers yet~</div>
      <div v-for="(layer, i) in layers" :key="layer.id"
        class="layer-row"
        :class="{ selected: layer.id === selectedId }"
        @click="emit('select', layer.id)"
      >
        <span class="layer-prefix">{{ layer.id === selectedId ? '★' : rowGlyph(i) }}</span>
        <span class="layer-name">{{ layer.content.slice(0, 18) || '(empty)' }}</span>
        <div class="layer-actions">
          <button class="order-btn" :disabled="i === 0" @click.stop="emit('move-up', layer.id)" title="Move up">▲</button>
          <button class="order-btn" :disabled="i === layers.length - 1" @click.stop="emit('move-down', layer.id)" title="Move down">▼</button>
          <button class="delete-btn" @click.stop="emit('delete', layer.id)" title="Delete">✖</button>
        </div>
      </div>
      <button class="add-btn" :class="{ active: addingText }" @click="emit('toggle-add')">
        {{ addingText ? '✦ CLICK & DRAG ON CANVAS' : '+ NEW TEXT!!' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TextLayer } from '../types'

defineProps<{
  layers: TextLayer[]
  selectedId: string | null
  addingText: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'delete', id: string): void
  (e: 'move-up', id: string): void
  (e: 'move-down', id: string): void
  (e: 'toggle-add'): void
}>()

const GLYPHS = ['·', '♥', '✦', '◆', '●', '▸']
function rowGlyph(i: number) { return GLYPHS[i % GLYPHS.length] }
</script>

<style scoped>
.section { display: flex; flex-direction: column; }
.section-body {
  background: #ffffff;
  border: 2px inset #808080;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.empty {
  font-family: 'Comic Sans MS', cursive;
  font-size: 11px;
  color: #888;
  text-align: center;
  padding: 4px;
}
.layer-row {
  background: #ffffcc;
  border: 1px solid #808080;
  padding: 4px 6px;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
}
.layer-row:hover { background: #ffff88; }
.layer-row.selected {
  background: linear-gradient(90deg, #ffff00, #ffaa00);
  font-weight: 700;
  border-color: #ff8800;
}
.layer-prefix { flex-shrink: 0; width: 12px; }
.layer-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.layer-actions { display: flex; gap: 2px; flex-shrink: 0; }
.order-btn {
  font-size: 9px;
  padding: 1px 3px;
  background: #c0c0c0;
  border: 1px outset #ffffff;
  cursor: pointer;
  font-family: 'Tahoma', sans-serif;
}
.order-btn:disabled { opacity: 0.4; cursor: default; }
.delete-btn {
  font-size: 11px;
  font-weight: 900;
  color: #ff0000;
  background: #c0c0c0;
  border: 1px outset #ffffff;
  cursor: pointer;
  padding: 1px 4px;
  font-family: 'Tahoma', sans-serif;
  line-height: 1;
}
.delete-btn:hover { background: #ff0000; color: #ffffff; }
.add-btn {
  margin-top: 4px;
  background: linear-gradient(180deg, #00ffff, #0088ff);
  border: 2px outset #88ffff;
  color: #ffffff;
  font-family: 'Impact', 'Arial Black', sans-serif;
  font-size: 14px;
  text-shadow: 1px 1px 0 #000;
  letter-spacing: 1px;
  padding: 6px 8px;
  cursor: pointer;
  width: 100%;
  text-transform: uppercase;
}
.add-btn.active {
  background: linear-gradient(180deg, #ffff00, #ff8800);
  border: 2px inset #ffdd00;
  color: #000000;
  text-shadow: none;
}
.add-btn:hover:not(.active) { background: linear-gradient(180deg, #88ffff, #00ccff); }
</style>
