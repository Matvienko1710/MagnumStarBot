// Утилита для управления кэшем
class CacheManager {
    constructor() {
        this.caches = new Map();
        this.stats = {
            totalSize: 0,
            hits: 0,
            misses: 0,
            evictions: 0
        };

        // Автоматическая очистка каждые 5 минут
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);

        // Принудительная очистка при нехватке памяти
        this.setupMemoryMonitoring();
    }

    // Метод для очистки всех интервалов (предотвращает утечку памяти)
    cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    
    // Создание нового кэша
    createCache(name, options = {}) {
        const cache = {
            data: new Map(),
            maxSize: options.maxSize || 100,
            ttl: options.ttl || 300000, // 5 минут по умолчанию
            lastAccess: new Map()
        };
        
        this.caches.set(name, cache);
        console.log(`✅ Кэш "${name}" создан с лимитом ${cache.maxSize} элементов`);
        return cache;
    }
    
    // Получение данных из кэша
    get(cacheName, key) {
        const cache = this.caches.get(cacheName);
        if (!cache) {
            this.stats.misses++;
            return null;
        }
        
        const item = cache.data.get(key);
        if (!item) {
            this.stats.misses++;
            return null;
        }
        
        // Проверяем TTL
        if (Date.now() - item.timestamp > cache.ttl) {
            cache.data.delete(key);
            cache.lastAccess.delete(key);
            this.stats.evictions++;
            return null;
        }
        
        // Обновляем время последнего доступа
        cache.lastAccess.set(key, Date.now());
        this.stats.hits++;
        
        return item.data;
    }
    
    // Сохранение данных в кэш
    set(cacheName, key, value, customTtl = null) {
        const cache = this.caches.get(cacheName);
        if (!cache) {
            console.error(`❌ Кэш "${cacheName}" не найден`);
            return false;
        }
        
        // Проверяем лимит размера
        if (cache.data.size >= cache.maxSize) {
            this.evictOldest(cacheName);
        }
        
        const ttl = customTtl || cache.ttl;
        cache.data.set(key, {
            data: value,
            timestamp: Date.now(),
            ttl: ttl
        });
        
        cache.lastAccess.set(key, Date.now());
        
        return true;
    }
    
    // Удаление старых элементов
    evictOldest(cacheName) {
        const cache = this.caches.get(cacheName);
        if (!cache || cache.data.size === 0) return;
        
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, lastAccess] of cache.lastAccess) {
            if (lastAccess < oldestTime) {
                oldestTime = lastAccess;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            cache.data.delete(oldestKey);
            cache.lastAccess.delete(oldestKey);
            this.stats.evictions++;
            console.log(`🗑️ Удален старый элемент из кэша "${cacheName}": ${oldestKey}`);
        }
    }
    
    // Очистка всех кэшей
    cleanup() {
        const beforeSize = this.getTotalSize();
        
        for (const [name, cache] of this.caches) {
            const beforeCount = cache.data.size;
            
            // Удаляем просроченные элементы
            for (const [key, item] of cache.data) {
                if (Date.now() - item.timestamp > item.ttl) {
                    cache.data.delete(key);
                    cache.lastAccess.delete(key);
                    this.stats.evictions++;
                }
            }
            
            const afterCount = cache.data.size;
            if (beforeCount !== afterCount) {
                console.log(`🧹 Кэш "${name}": очищено ${beforeCount - afterCount} элементов`);
            }
        }
        
        const afterSize = this.getTotalSize();
        console.log(`🧹 Очистка завершена. Память: ${beforeSize} → ${afterSize} МБ`);
    }
    
    // Принудительная очистка
    clear(cacheName = null) {
        if (cacheName) {
            const cache = this.caches.get(cacheName);
            if (cache) {
                const size = cache.data.size;
                cache.data.clear();
                cache.lastAccess.clear();
                console.log(`🗑️ Кэш "${cacheName}" очищен (${size} элементов)`);
            }
        } else {
            // Очищаем все кэши
            for (const [name, cache] of this.caches) {
                cache.data.clear();
                cache.lastAccess.clear();
            }
            console.log('🗑️ Все кэши очищены');
        }
    }
    
    // Получение статистики
    getStats() {
        return {
            ...this.stats,
            totalSize: this.getTotalSize(),
            caches: Object.fromEntries(
                Array.from(this.caches.entries()).map(([name, cache]) => [
                    name,
                    {
                        size: cache.data.size,
                        maxSize: cache.maxSize,
                        ttl: cache.ttl
                    }
                ])
            )
        };
    }
    
    // Получение размера в МБ
    getTotalSize() {
        let total = 0;
        for (const cache of this.caches.values()) {
            total += cache.data.size;
        }
        // Примерная оценка: 1 элемент ≈ 1 КБ
        return Math.round(total / 1024 * 100) / 100;
    }
    
    // Мониторинг памяти
    setupMemoryMonitoring() {
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100;
            
            // Если память превышает 100 МБ, принудительно чистим
            if (heapUsed > 100) {
                console.log(`⚠️ Высокое потребление памяти: ${heapUsed} МБ. Принудительная очистка...`);
                this.cleanup();
                
                // Принудительный сбор мусора
                if (global.gc) {
                    global.gc();
                    console.log('🗑️ Принудительный сбор мусора выполнен');
                }
            }
        }, 60 * 1000); // Каждую минуту
    }
}

// Создаем единственный экземпляр
const cacheManager = new CacheManager();

// Создаем стандартные кэши
cacheManager.createCache('users', { maxSize: 50, ttl: 300000 }); // 5 минут
cacheManager.createCache('miners', { maxSize: 20, ttl: 600000 }); // 10 минут
cacheManager.createCache('titles', { maxSize: 10, ttl: 1800000 }); // 30 минут

module.exports = cacheManager;
