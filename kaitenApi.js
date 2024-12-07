
const CACHE_PREFIX = "kaiten-cache"; // Префикс для вашего кэша
const CACHE_EXPIRATION_TIME = 15 * 60 * 1000; // 15 минут в миллисекундах

// Функция для работы с Cache API
class CacheAPIWrapper {
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
}

// Создаем экземпляр кэша
const cacheAPI = new CacheAPIWrapper(CACHE_PREFIX, CACHE_EXPIRATION_TIME);

const withCacheAPI = async (key, fn, cache = cacheAPI) => {
    const cachedData = await cache.get(key);
    if (cachedData) {
        console.log("Returning cached data from Cache API...");
        return cachedData;
    }

    console.log("Fetching fresh data...");
    const result = await fn();
    await cache.set(key, result);
    return result;
};

// for auto-pagination:
export const fetchKaitenAllData = async () => {
    console.log("Fetching Kaiten cards...");
    let allData = [];  // Array to store all results
    let offset = 0;    // Start offset
    let hasMoreData = true;

    while (hasMoreData) {
        try {
            // Construct URL with the current offset
            const url = `${API_URL}?space_id=${SPACE_ID}&offset=${offset}&limit=${PAGE_SIZE}&additional_card_fields=description&archived=false`;

            // Make the API call
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${ACCESS_TOKEN}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const extractedFieldsJson = data.map(obj => ({
                id: obj.id,
                title: obj.title,
                description: obj.description,
                archived: obj.archived,
                state: obj.state,
                time_spent_sum: obj.time_spent_sum,
                time_blocked_sum: obj.time_blocked_sum,
                blocked: obj.blocked,
                size_text: obj.size_text,
                owner: obj.owner.full_name,
            }));

            // Add the current batch to the overall data
            allData = allData.concat(extractedFieldsJson);

            // Check if we should fetch more
            if (data.length < PAGE_SIZE) {
                hasMoreData = false;  // No more data to fetch
            } else {
                offset += PAGE_SIZE; // Increment the offset
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            break;
        }
    }

    console.log("Kaiten cards fetched:", allData);
    return allData;  // Return the aggregated data
};

// Используем метод с кэшированием
export const fetchKaitenDataWithCache = async () => {
    return await withCacheAPI(SPACE_ID, fetchKaitenAllData);
};


