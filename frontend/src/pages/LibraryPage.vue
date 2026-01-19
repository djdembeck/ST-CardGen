<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { deleteLibraryItem, listLibrary, loadLibraryItem, type LibraryItem } from "@/services/library";
import { useCharacterStore } from "@/stores/characterStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const router = useRouter();
const characterStore = useCharacterStore();
const workspaceStore = useWorkspaceStore();

const items = ref<LibraryItem[]>([]);
const dir = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const notice = ref<string | null>(null);
const deletingId = ref<string | null>(null);

async function fetchLibrary() {
  loading.value = true;
  error.value = null;
  try {
    const res = await listLibrary();
    if (!res.ok) {
      error.value = res.error ?? "Failed to load library.";
      return;
    }
    const stamp = Date.now();
    items.value = (res.items ?? []).map((item) => ({
      ...item,
      pngUrl: item.pngUrl ? `${item.pngUrl}${item.pngUrl.includes("?") ? "&" : "?"}_=${stamp}` : null,
    }));
    dir.value = res.dir ?? "";
  } catch (e: any) {
    error.value = String(e?.message ?? e);
  } finally {
    loading.value = false;
  }
}

async function onOpen(item: LibraryItem) {
  error.value = null;
  notice.value = null;
  try {
    const res = await loadLibraryItem(item.id);
    if (!res.ok || !res.cardV2) {
      error.value = res.error ?? "Failed to load card.";
      return;
    }
    workspaceStore.idea = "";
    characterStore.applyCardData(res.cardV2.data);
    if (res.avatarPngUrl) characterStore.avatarUrl = res.avatarPngUrl;
    characterStore.setLibraryId(item.id);
    router.push("/character");
  } catch (e: any) {
    error.value = String(e?.message ?? e);
  }
}

async function onDelete(item: LibraryItem) {
  if (!window.confirm("Delete? Are you sure?")) return;
  deletingId.value = item.id;
  error.value = null;
  notice.value = null;
  try {
    const res = await deleteLibraryItem(item.id);
    if (!res.ok) {
      error.value = res.error ?? "Failed to delete card.";
      return;
    }
    items.value = items.value.filter((entry) => entry.id !== item.id);
    notice.value = "Deleted.";
  } catch (e: any) {
    error.value = String(e?.message ?? e);
  } finally {
    deletingId.value = null;
  }
}

onMounted(fetchLibrary);

function onLibraryRefresh() {
  fetchLibrary();
}

onMounted(() => {
  window.addEventListener("ccg-library-refresh", onLibraryRefresh);
});

onUnmounted(() => {
  window.removeEventListener("ccg-library-refresh", onLibraryRefresh);
});
</script>

<template>
  <section class="page">
    <div data-page-top tabindex="-1" style="outline:none;"></div>
    <div class="header">
      <div>
        <h1>Library</h1>
        <p class="muted">Folder: {{ dir || "Not set" }}</p>
      </div>
      <button class="ghost" @click="fetchLibrary" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="notice" class="muted">{{ notice }}</p>

    <div v-if="!items.length && !loading" class="empty">No saved characters yet.</div>

    <div class="grid">
      <div v-for="item in items" :key="item.id" class="card" @click="onOpen(item)">
        <div class="thumb">
          <img v-if="item.pngUrl" :src="item.pngUrl" alt="" />
          <div v-else class="placeholder">No image</div>
          <div class="thumbTitle">{{ item.name || item.fileBase || "Unnamed" }}</div>
          <button
            class="trash"
            type="button"
            :disabled="deletingId === item.id"
            @click.stop="onDelete(item)"
            aria-label="Delete"
          >
            🗑
          </button>
        </div>
        <div class="meta">
          <div class="name">{{ item.name || "Untitled" }}</div>
          <div class="muted">{{ new Date(item.updatedAt).toLocaleString() }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.card {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--panel);
  overflow: hidden;
  cursor: pointer;
  display: grid;
  gap: 8px;
}
.thumb {
  background: var(--panel-3);
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}
.trash {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 6px 8px;
  opacity: 0;
  transition: opacity 120ms ease;
  cursor: pointer;
}
.card:hover .trash {
  opacity: 1;
}
.trash:disabled {
  opacity: 0.5;
  cursor: default;
}
.trash:hover:not(:disabled) {
  opacity: 1;
  background: rgba(255, 0, 0, 0.3);
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.placeholder {
  color: var(--muted);
  font-size: 13px;
}
.thumbTitle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 10px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0));
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.meta {
  padding: 10px 12px 14px;
  display: grid;
  gap: 4px;
}
.name {
  font-weight: 600;
}
.muted {
  color: var(--muted);
  font-size: 13px;
}
.error {
  color: #c94a4a;
  font-weight: 600;
}
.empty {
  color: var(--muted);
  padding: 16px;
  border: 1px dashed var(--border-2);
  border-radius: 12px;
}
.ghost {
  background: transparent;
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
</style>
