
const CACHE_PREFIX = "kaiten-cache"; // Префикс для вашего кэша
const CACHE_EXPIRATION_TIME = 15 * 60 * 1000; // 15 минут в миллисекундах

const CacheApiWrapper = (await import(chrome.runtime.getURL("cacheApiWrapper.js"))).CacheApiWrapper;

// Создаем экземпляр кэша
const cacheApi = new CacheApiWrapper(CACHE_PREFIX, CACHE_EXPIRATION_TIME);


// for auto-pagination:
export const fetchKaitenAllData = async () => {
    console.log("Fetching Kaiten cards...");
    let allData = [];  // Array to store all results
    let offset = 0;    // Start offset
    let hasMoreData = true;

    while (hasMoreData) {
        try {
            // Construct URL with the current offset
            const url = `${API_URL}?space_id=${SPACE_ID}&offset=${offset}&limit=${PAGE_SIZE}&additional_card_fields=description`;

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
            const extractedFieldsJson = data.map(obj => {
                const responsibleMember = obj.members?.find(member => member.type === 2);
                return {
                    id: obj.id,
                    title: obj.title,
                    description: obj.description,
                    archived: obj.archived,
                    state: obj.state,
                    time_spent_sum: obj.time_spent_sum,
                    time_blocked_sum: obj.time_blocked_sum,
                    blocked: obj.blocked,
                    size_text: obj.size_text,
                    completed_at: obj.completed_at,
                    responsible: responsibleMember?.full_name || obj.owner?.full_name || "Unassigned",
                }
            });

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
    return await cacheApi.withCacheApi(SPACE_ID, fetchKaitenAllData);
};


