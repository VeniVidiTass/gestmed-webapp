import { ref, computed } from 'vue'

// Cache globale per il prefetch (condiviso tra tutte le istanze)
const prefetchCache = ref({
    visitedRoutes: new Set(),
    lastPrefetchTime: null,
    prefetchCooldown: 2 * 60 * 1000, // 2 minuti di cooldown
    sessionPrefetched: false,
    dataFreshness: new Map() // Traccia la freschezza dei dati per route specifica
})

export function usePrefetchCache() {

    const shouldSkipPrefetch = (routeName) => {
        const cache = prefetchCache.value
        const now = Date.now()

        // Se abbiamo già fatto prefetch in questa sessione e sono passati meno di 2 minuti
        if (cache.sessionPrefetched && cache.lastPrefetchTime &&
            (now - cache.lastPrefetchTime) < cache.prefetchCooldown) {
            console.log(`⏭️ Skipping prefetch for ${routeName} - in cooldown period`)
            return true
        }

        // Se abbiamo già visitato questa route in questa sessione
        if (cache.visitedRoutes.has(routeName)) {
            console.log(`⏭️ Skipping prefetch for ${routeName} - already visited this session`)
            return true
        }

        // Se abbiamo dati fresh per questa route specifica (meno di 5 minuti)
        const routeFreshness = cache.dataFreshness.get(routeName)
        if (routeFreshness && (now - routeFreshness) < (5 * 60 * 1000)) {
            console.log(`⏭️ Skipping prefetch for ${routeName} - data is still fresh`)
            return true
        }

        return false
    }

    const markRouteVisited = (routeName) => {
        const cache = prefetchCache.value
        const now = Date.now()

        cache.visitedRoutes.add(routeName)
        cache.lastPrefetchTime = now
        cache.sessionPrefetched = true
        cache.dataFreshness.set(routeName, now)

        console.log(`✅ Route ${routeName} marked as visited and prefetched`)
    }

    const clearCache = () => {
        prefetchCache.value = {
            visitedRoutes: new Set(),
            lastPrefetchTime: null,
            prefetchCooldown: 2 * 60 * 1000,
            sessionPrefetched: false,
            dataFreshness: new Map()
        }
        console.log('🧹 Prefetch cache cleared')
    }

    const resetCooldown = () => {
        prefetchCache.value.lastPrefetchTime = null
        prefetchCache.value.sessionPrefetched = false
        console.log('🔄 Prefetch cooldown reset')
    }

    const isInCooldown = computed(() => {
        const cache = prefetchCache.value
        const now = Date.now()

        return cache.sessionPrefetched &&
            cache.lastPrefetchTime &&
            (now - cache.lastPrefetchTime) < cache.prefetchCooldown
    })

    const getCacheInfo = computed(() => ({
        visitedRoutes: Array.from(prefetchCache.value.visitedRoutes),
        lastPrefetchTime: prefetchCache.value.lastPrefetchTime,
        sessionPrefetched: prefetchCache.value.sessionPrefetched,
        isInCooldown: isInCooldown.value,
        dataFreshness: Object.fromEntries(prefetchCache.value.dataFreshness)
    }))

    // Funzione per forzare il prefetch anche se in cache
    const forcePrefetch = (routeName) => {
        const cache = prefetchCache.value
        cache.visitedRoutes.delete(routeName)
        cache.dataFreshness.delete(routeName)
        console.log(`🔄 Forced prefetch enabled for ${routeName}`)
    }

    return {
        shouldSkipPrefetch,
        markRouteVisited,
        clearCache,
        resetCooldown,
        forcePrefetch,
        isInCooldown,
        getCacheInfo
    }
}
