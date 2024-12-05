// noinspection ExceptionCaughtLocallyJS
// noinspection JSUnresolvedReference

const that = {};

chrome.storage.local.get(['API_URL', 'ACCESS_TOKEN', 'OPENAI_KEY'], (result) => {
    that.API_URL = result.API_URL;
    that.ACCESS_TOKEN = result.ACCESS_TOKEN;
    that.OPENAI_KEY = result.OPENAI_KEY;
});

export async function executeSearch(question, dataToSearch, spaceId) {
    // todo: создать ембеддинговые запросы
    // const response = await getCompletion([{role: "system", content: getSearchPrompt(question, promptAugmentation, spaceId)}]);
    
    // todo: кэш пока что падает с ошибкой Ошибка: Failed to execute 'setItem' on 'Storage': Setting the value of 'embeddings_cache_Переехать с Nimble на натив: DUIKit' exceeded the quota.
    const queryEmbedding = await getEmbeddings([question]);
    
    // todo: можно кэшировать в локал сторадже все эмбеддинги

    // todo: метод для конвертации карточки с названием и дескрипшном в одну строку
    // todo: запихнуть это вместе в эмбеддинг, а не только тайтл
    const cardTexts = dataToSearch.map(d => d.title);
    const cardEmbeddings = (await getEmbeddings(cardTexts));
    
    const nearestEmbeddings = findTopNCosine(cardEmbeddings, queryEmbedding[0], 100);
    console.log("Nearest embeddings:", nearestEmbeddings);
    const promptAugmentation = nearestEmbeddings.reduce((sum, embedding) => {
        const card = dataToSearch[embedding.vector.index];
        return card 
            ? sum + `- Card Id: ${card.id}; Card title: "${card.title}"; Description: ${card.description}\n\n\n`
            : sum;
    }, '');
    
    const response = await getCompletion([{role: "system", content: getSearchPrompt(question, promptAugmentation, spaceId)}]);
    console.log("Final response:", response);
    
    return response;
}



// ================================= Chat GPT logic
function getSearchPrompt(userQuery, augmentedContext, spaceId) {
    const urlForCards = `https://dodopizza.kaiten.ru/space/${spaceId}/card`;
    const prompt =
        `Ты помощник, который находит нужные данные на основе предоставленных данных о карточках из доски с задачами.
        Запрос пользователя: "${userQuery}".
        Поиск по базе данных выдал следующие результаты: 
        ${augmentedContext}
        
        - Среди данного списка найди и выдай список id и title карточек, которые лучше всего отвечают искомому запросу, 
        и оформи итоговый ответ с указанием ссылок на карточки в следующем виде html разметки (т.е. сделай сам title
        карточек кликабельными ссылками):
        "
        • <a href='${urlForCards}/ID_КАРТОЧКИ_1'>TITLE_КАРТОЧКИ_1</a>
        <br>
        • <a href='${urlForCards}/ID_КАРТОЧКИ_2'>TITLE_КАРТОЧКИ_2</a>
        ...
        ".
        - При этом не обязательно выдавать сухой список ссылок, и если это будет необходимо для понимания, можно дать
        комментарии и пояснения для пользователя.
        - Если среди приведенных данных нет карточек, которые удовлетворяют запросу пользователя, так и сообщи, что
        карточек не найдено.
        `;
    return prompt;
}





// ================================= Semantic search
function cosineSimilarity(vectorA, vectorB) {
    const dotProduct = vectorA.reduce((sum, a, idx) => sum + a * vectorB[idx], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

function findNearestCosine(embeddings, queryVector) {
    return embeddings.reduce((nearest, vector) => {
        const similarity = cosineSimilarity(vector, queryVector);
        return similarity > nearest.similarity
            ? { vector, similarity }
            : nearest;
    }, { vector: null, similarity: -Infinity });
}

function findTopNCosine(embeddings, queryVector, N) {
    const similarities = embeddings.map(vector => ({
        vector,
        similarity: cosineSimilarity(vector.embedding, queryVector.embedding),
    }));

    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, N);
}


// ================================= OpenAI API
export async function testCompletion() {
    const response = await getCompletion([{role: "user",content: "Hello! Respond something so I can understand that you are working"}]);
    console.log("Successful completions test:", response);
    
    const embeddings = await getEmbeddings(["Big red fox is jumping", "Big red fox is running"]);
    console.log("Successful embeddings test:", embeddings);
}

async function getCompletion(messages, options = {}) {
    const response = await sendRequest("chat/completions", "POST", {
        model: "gpt-4o",
        messages: messages,
        ...options
    })
    return response.choices[0].message.content;
}

async function getEmbeddings(inputArray, options = {}) {
    if (inputArray.length === 0)
        return [];
    
    const response = await sendRequest("embeddings", "POST", {
        input: inputArray,
        // model: "text-embedding-ada-002", // $0.100 / 1M tokens
        // model: "text-embedding-3-large", // $0.130 / 1M tokens
        model: "text-embedding-3-small", // $0.020 / 1M tokens
        encoding_format: "float",
        ...options
    });
    return response.data;
}

// todo: кэшируются и индексы, а вот это уже некорректно. нужно искать по тексту
async function getEmbeddingsCachedVersion(inputArray, options = {}) {
    const storagePrefix = "embeddings_cache_";
    const maxCacheKeyLength = 2000; // Max character limit for caching
    const cachedAndFetchedData = {};
    const toFetch = [];

    // Check cache and prepare list of non-cached texts
    for (const text of inputArray) {
        const cacheKey = `${storagePrefix}${text}`;
        if (localStorage.getItem(cacheKey)) {
            cachedAndFetchedData[text] = JSON.parse(localStorage.getItem(cacheKey));
        } else {
            toFetch.push(text);
        }
    }
    
    // Fetch embeddings for non-cached texts
    const fetchResponse = getEmbeddings(toFetch, options)
    
    // Cache new results and add them to results object
    for (let i = 0; i < toFetch.length; i++) {
        const text = toFetch[i];
        const embedding = fetchResponse[i];
        cachedAndFetchedData[text] = embedding;

        if (text.length <= maxCacheKeyLength) {
            const cacheKey = `${storagePrefix}${text}`;
            localStorage.setItem(cacheKey, JSON.stringify(embedding));
        }
    }

    // Return results in the same order as inputArray
    return inputArray.map(text => cachedAndFetchedData[text]);
}

async function sendRequest(urlPath, method, payload) {
    try {
        const response = await fetch(`https://api.openai.com/v1/${urlPath}`, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${that.OPENAI_KEY}`,
                "OpenAI-Beta": "assistants=v2",
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const parsed = await response.json();
        console.log(`Response for ${urlPath}:`, parsed);
        return parsed;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}