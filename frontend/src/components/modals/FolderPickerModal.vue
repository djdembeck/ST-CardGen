<script setup lang="ts">
import { ref, watch } from "vue";
import { getFsRoots, listFsDir } from "@/services/fs";

const props = defineProps<{
  modelValue: boolean;
  initialPath?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "select", path: string): void;
}>();

const roots = ref<string[]>([]);
const currentPath = ref("");
const parentPath = ref<string | null>(null);
const dirs = ref<{ name: string; path: string }[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

function close() {
  emit("update:modelValue", false);
}

async function loadRoots() {
  const res = await getFsRoots();
  roots.value = res.roots;
}

async function loadDir(path: string) {
  loading.value = true;
  error.value = null;
  try {
    const res = await listFsDir(path);
    if (!res.ok) throw new Error(res.error ?? "Unable to list directory");
    currentPath.value = res.path;
    parentPath.value = res.parent;
    dirs.value = res.dirs;
  } catch (e: any) {
    error.value = String(e?.message ?? e);
  } finally {
    loading.value = false;
  }
}

function onRootChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value) loadDir(value);
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    error.value = null;
    dirs.value = [];
    await loadRoots();
    const start = props.initialPath && props.initialPath.length ? props.initialPath : roots.value[0];
    if (start) await loadDir(start);
  }
);

function onUseFolder() {
  if (!currentPath.value) return;
  emit("select", currentPath.value);
  close();
}
</script>

<template>
  <div v-if="modelValue" class="overlay">
    <div class="modal">
      <div class="header">
        <h2>Choose Library Folder</h2>
        <button class="ghost" @click="close">Close</button>
      </div>

      <div class="row">
        <label class="field">
          <span>Root</span>
          <select @change="onRootChange">
            <option v-for="root in roots" :key="root" :value="root">{{ root }}</option>
          </select>
        </label>
        <div class="current">
          <span class="label">Current</span>
          <div class="path">{{ currentPath }}</div>
        </div>
      </div>

      <div class="list">
        <button v-if="parentPath" class="ghost" @click="loadDir(parentPath)">Up one level</button>
        <div v-if="loading" class="muted">Loading...</div>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-for="dir in dirs" :key="dir.path" class="dir" @click="loadDir(dir.path)">
          {{ dir.name }}
        </div>
      </div>

      <div class="footer">
        <button @click="onUseFolder" :disabled="!currentPath">Use this folder</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 6, 10, 0.7);
  display: grid;
  place-items: center;
  z-index: 30;
}
.modal {
  width: min(760px, 94vw);
  max-height: 90vh;
  overflow: hidden;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 12px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 12px;
}
.field {
  display: grid;
  gap: 6px;
}
.field select {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border-2);
  background: var(--panel-3);
  color: var(--text);
}
.current {
  display: grid;
  gap: 6px;
}
.label {
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.02em;
}
.path {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border-2);
  background: var(--panel-3);
  color: var(--text);
}
.list {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  background: var(--panel-3);
  max-height: 45vh;
  overflow: auto;
  display: grid;
  gap: 6px;
}
.dir {
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
}
.dir:hover {
  background: var(--accent);
  border-color: var(--border-2);
}
.footer {
  display: flex;
  justify-content: flex-end;
}
.ghost {
  background: transparent;
}
.error {
  color: #c94a4a;
  font-weight: 600;
}
.muted {
  color: var(--muted);
}
button {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-2);
  background: var(--accent);
  color: var(--text);
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: default;
}
@media (max-width: 720px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
