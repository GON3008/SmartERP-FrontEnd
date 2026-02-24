import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getNotifications } from '@/api/notification'

const LS_READ_IDS = 'notif_read_ids'   // Set<string> — IDs đã đọc từng cái
const LS_READ_ALL = 'notif_read_all_at' // ISO timestamp — đánh dấu đọc hết

// ─── Helpers localStorage ──────────────────────────────────────────────────

function getReadIds() {
    try {
        return new Set(JSON.parse(localStorage.getItem(LS_READ_IDS) || '[]'))
    } catch { return new Set() }
}

function saveReadIds(set) {
    // Giữ tối đa 500 ID để tránh localStorage phình to
    const arr = [...set].slice(-500)
    localStorage.setItem(LS_READ_IDS, JSON.stringify(arr))
}

function getReadAllAt() {
    return localStorage.getItem(LS_READ_ALL) || null
}

function saveReadAllAt() {
    localStorage.setItem(LS_READ_ALL, new Date().toISOString())
}

/** Kiểm tra 1 item có chưa đọc không */
export function isItemUnread(item) {
    if (!item) return false

    // Item không có timestamp → không thể biết có mới không → bỏ qua khỏi badge
    const t = item.created_at ?? item.time ?? null
    if (!t) return false

    // Đã đọc riêng lẻ theo ID
    const id = String(item.id ?? '')
    if (id && getReadIds().has(id)) return false

    // Đã bấm "đọc hết" → check timestamp
    const readAllAt = getReadAllAt()
    if (readAllAt && new Date(t) <= new Date(readAllAt)) return false

    return true
}

// ─── Composable ────────────────────────────────────────────────────────────

/**
 * useNotifications — fetches notification list, tracks read/unread per item.
 * Polls every `intervalMs` ms (default 60s).
 */
export function useNotifications(intervalMs = 60_000) {
    const items = ref([])
    const loading = ref(false)
    // trigger ref: tăng lên mỗi khi read-state thay đổi để computed re-run
    const readTick = ref(0)
    let timer = null

    /** Số thông báo chưa đọc (reactive theo readTick) */
    const count = computed(() => {
        readTick.value // dependency
        return items.value.filter(isItemUnread).length
    })

    async function fetchItems() {
        loading.value = true
        try {
            const res = await getNotifications({ per_page: 30 })
            items.value = res.data ?? res ?? []
        } catch {
            items.value = []
        } finally {
            loading.value = false
        }
    }

    async function refresh() {
        await fetchItems()
    }

    /** Đánh dấu 1 thông báo đã đọc theo ID */
    function markRead(item) {
        const id = String(item?.id ?? item?.title ?? '')
        if (!id) return
        const set = getReadIds()
        set.add(id)
        saveReadIds(set)
        readTick.value++
    }

    /** Đánh dấu TẤT CẢ đã đọc (dùng timestamp) */
    function markAllRead() {
        saveReadAllAt()
        readTick.value++
    }

    /** Backward-compat */
    function clearCount() { markAllRead() }

    onMounted(() => {
        refresh()
        timer = setInterval(refresh, intervalMs)
    })

    onUnmounted(() => {
        if (timer) clearInterval(timer)
    })

    return { count, items, loading, refresh, markRead, markAllRead, clearCount }
}
