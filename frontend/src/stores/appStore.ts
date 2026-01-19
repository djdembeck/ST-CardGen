import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export const useAppStore = defineStore('app', () => {
  const status = useLocalStorage<string>('ccg_status', 'Starting…')

  function setStatus(s: string) {
    status.value = s
  }

  return { status, setStatus }
})
