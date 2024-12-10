
export class CacheApiWrapper {
    constructor(cachePrefix, expirationTime) {
        this.cachePrefix = cachePrefix;
        this.expirationTime = expirationTime;
    }

    async getCache() {
        return await caches.open(this.cachePrefix);
    }

    async get(key) {
        const cache = await this.getCache();
        const cachedResponse = await cache.match(key);
        if (!cachedResponse) return null;

        const cachedData = await cachedResponse.json();
        const isExpired = Date.now() - cachedData.timestamp > this.expirationTime;

        if (isExpired) {
            await cache.delete(key); // Удаляем устаревший кэш
            return null;
        }

        return cachedData.value; // Возвращаем кэшированные данные
    }

    async set(key, value) {
        const cache = await this.getCache();
        const dataToCache = {
            value,
            timestamp: Date.now(),
        };
        const response = new Response(JSON.stringify(dataToCache), {
            headers: { "Content-Type": "application/json" },
        });
        await cache.put(key, response); // Сохраняем данные в кэш
    }

    async clear() {
        const cache = await this.getCache();
        const keys = await cache.keys();
        for (const request of keys) {
            await cache.delete(request);
        }
    }

    async withCacheApi(key, fn) {
        const cachedData = await this.get(key);
        if (cachedData) {
            console.log("Returning cached data from Cache API...");
            return cachedData;
        }

        console.log("Fetching fresh data...");
        const result = await fn();
        await this.set(key, result);
        return result;
    };
}