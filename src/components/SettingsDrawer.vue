<template>
  <div class="drawer" :class="{ collapsed }">
    <!-- Collapse toggle on the left edge -->
    <button class="collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? 'Open' : 'Collapse'">
      {{ collapsed ? '◀' : '▶' }}
    </button>

    <div class="drawer-inner" v-show="!collapsed">
      <GlobalSettings
        :modelValue="{ transparentBgColor: state.transparentBgColor, inversionMode: state.inversionMode }"
        @update:transparentBgColor="emit('update:transparentBgColor', $event)"
        @update:inversionMode="emit('update:inversionMode', $event)"
      />
      <LayerList
        :layers="state.textLayers"
        :selectedId="state.selectedLayerId"
        :addingText="state.addingText"
        @select="emit('select', $event)"
        @delete="emit('delete-layer', $event)"
        @move-up="emit('move-up', $event)"
        @move-down="emit('move-down', $event)"
        @toggle-add="emit('toggle-add')"
      />
      <TextLayerSettings
        :layer="selectedLayer"
        @update="onLayerUpdate"
      />
      <button class="export-btn" @click="emit('export')">💾 SAVE .PNG !!!</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AppState, TextLayer } from '../types'
import GlobalSettings from './GlobalSettings.vue'
import LayerList from './LayerList.vue'
import TextLayerSettings from './TextLayerSettings.vue'

const props = defineProps<{ state: AppState }>()
const emit = defineEmits<{
  (e: 'update:transparentBgColor', v: string): void
  (e: 'update:inversionMode', v: 'rgb' | 'luminance'): void
  (e: 'select', id: string): void
  (e: 'delete-layer', id: string): void
  (e: 'move-up', id: string): void
  (e: 'move-down', id: string): void
  (e: 'toggle-add'): void
  (e: 'update-layer', id: string, patch: Partial<TextLayer>): void
  (e: 'export'): void
}>()

const collapsed = ref(false)

const selectedLayer = computed<TextLayer | undefined>(() =>
  props.state.textLayers.find((l) => l.id === props.state.selectedLayerId),
)

// TextLayerSettings emits (id, patch) — relay to parent
function onLayerUpdate(id: string, patch: Partial<TextLayer>) {
  emit('update-layer', id, patch)
}
</script>

<style scoped>
.drawer {
  width: 260px;
  flex-shrink: 0;
  background: #c0c0c0;
  border: 3px outset #ffffff;
  display: flex;
  flex-direction: row;
  position: relative;
  transition: width 0.15s;
}
.drawer.collapsed {
  width: 28px;
}
.collapse-btn {
  position: absolute;
  left: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 48px;
  background: #c0c0c0;
  border: 2px outset #ffffff;
  cursor: pointer;
  font-size: 10px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000080;
  font-weight: 700;
}
.drawer-inner {
  flex: 1;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
}
.export-btn {
  margin-top: auto;
  background: linear-gradient(180deg, #ff0000, #aa0000);
  border: 4px outset #ff6666;
  color: #ffff00;
  font-family: 'Impact', 'Arial Black', sans-serif;
  font-size: 18px;
  text-shadow: 2px 2px 0 #000;
  letter-spacing: 2px;
  padding: 10px 8px;
  cursor: pointer;
  width: 100%;
  text-transform: uppercase;
  animation: pulse 0.8s ease-in-out infinite;
}
.export-btn:hover {
  background: linear-gradient(180deg, #ff4444, #cc0000);
}
.export-btn:active {
  border-style: inset;
  transform: scale(0.98);
}
</style>
