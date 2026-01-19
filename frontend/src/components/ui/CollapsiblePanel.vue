<script setup lang="ts">
const props = defineProps<{
  title: string;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

function toggle() {
  emit("update:modelValue", !props.modelValue);
}
</script>

<template>
  <section class="panel">
    <button
      class="panelHeader"
      type="button"
      :aria-expanded="modelValue"
      @click="toggle"
    >
      <span class="panelTitle">{{ title }}</span>
      <span class="chev">{{ modelValue ? "▼" : "▶" }}</span>
  </button>
    <div v-if="modelValue" class="panelBody">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--panel);
  overflow: hidden;
}
.panelHeader {
  width: 100%;
  border: none;
  background: var(--panel-3);
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  font: inherit;
  text-align: left;
}
.panelTitle {
  font-weight: 700;
  letter-spacing: 0.01em;
}
.chev {
  font-size: 14px;
  opacity: 0.8;
}
.panelBody {
  padding: 16px;
  border-top: 1px solid var(--border);
}
</style>
