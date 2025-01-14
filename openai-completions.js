// noinspection ExceptionCaughtLocallyJS
// noinspection JSUnresolvedReference

const that = {};

chrome.storage.local.get(['API_URL', 'ACCESS_TOKEN', 'OPENAI_KEY'], (result) => {
    that.API_URL = result.API_URL;
    that.ACCESS_TOKEN = result.ACCESS_TOKEN;
    that.OPENAI_KEY = result.OPENAI_KEY;
});

const CacheApiWrapper = (await import(chrome.runtime.getURL("cacheApiWrapper.js"))).CacheApiWrapper;
const cacheApi = new CacheApiWrapper("sts-embeddings/space-id=", 15 * 60 * 1000);

export async function executeSearch(question, dataToSearch, spaceId) {
    //const improvedEmbeddingQuery = await getImprovedEmbeddingQuery(question);
    
    const queryEmbedding = await getEmbeddingsCachedVersion([question], `text_${question}`);
    
    // todo: метод для конвертации карточки с названием и дескрипшном в одну строку. надо запихнуть это вместе в эмбеддинг, а не только тайтл
    // todo: композиция именно параметров типа "title:, owner:" будет ухудшать качество семантического поиска.
    //       для поиска по параметрам надо использовать предварительный gpt shot и параметры API 
    const cardTexts = dataToSearch.map(d => JSON.stringify(d));
    const cardTitles = dataToSearch.map(d => JSON.stringify(d.title));
    const cardDescription = dataToSearch.map(d => JSON.stringify(d.description));
    const cardResponsible = dataToSearch.map(d => JSON.stringify(d.responsible));
    
    const cardEmbeddings = (await getEmbeddingsCachedVersion(cardTexts, `space-id_${spaceId}`));
    const cardTitlesEmbeddings = (await getEmbeddingsCachedVersion(cardTitles, `space-id_titles_${spaceId}`));
    const cardDescriptionEmbeddings = (await getEmbeddingsCachedVersion(cardDescription, `space-id_description_${spaceId}`));
    const cardResponsibleEmbeddings = (await getEmbeddingsCachedVersion(cardResponsible, `space-id_responsible_${spaceId}`));


    // Агрегация схожести по всем полям для каждой карточки
    const similarities = dataToSearch.map((card, index) => {
        const cardSimilarity = cosineSimilarity(queryEmbedding[0], cardEmbeddings[index]);
        const titleSimilarity = cosineSimilarity(queryEmbedding[0], cardTitlesEmbeddings[index]);
        const descriptionSimilarity = cosineSimilarity(queryEmbedding[0], cardDescriptionEmbeddings[index]);
        const responsibleSimilarity = cosineSimilarity(queryEmbedding[0], cardResponsibleEmbeddings[index]);

        // Усредняем схожесть или используем другую функцию агрегации
        const aggregatedSimilarity = (cardSimilarity + titleSimilarity + descriptionSimilarity + responsibleSimilarity) / 4;

        return { cardId: card.id, similarity: aggregatedSimilarity };
    });

    // Сортируем карточки по схожести
    const sortedCards = similarities.sort((a, b) => b.similarity - a.similarity);
    
    const promptAugmentation = sortedCards.reduce((sum, embedding) => {
        const card = dataToSearch[embedding.vector.index];
        return card 
            ? sum + `${JSON.stringify(card)}\n\n\n`
            : sum;
    }, '');
    console.log("Proper cards with augmentation:", promptAugmentation);
    
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
        
        - Учти что сегодняшняя дата ${Date.now()}
        - Учти что у которых проставлена дата окончания считаются завершенными. Остальные нет.
        - Если спросили найти информацию по владельцу карточки, то ищи по полю responsible и только по нему.
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

function getEmbeddingSearchTermPrompt(userQuery) {
    const prompt =
        `Преобразуй данный вопрос пользователя в текст, который можно использовать для семантического векторного поиска. Если вопрос
        уже в достаточной степени подходит для того, чтобы использовать его в семантическом векторном поиске, оставь его как есть.
        Вопрос пользователя: "${userQuery}"
        Скорректированный запрос помести в поле improved_embedding_query, оставляя поле error_description пустым.
        Если по каким-то причинам это невозможно, опиши ошибку в поле error_description.`;
    return prompt;
}

async function getImprovedEmbeddingQuery(question) {
    const jsonSchema =
        {
            "name": "embedding_improvement",
            "schema": {
                "type": "object",
                "properties": {
                    "improved_embedding_query": {"type": "string"},
                    "error_description": {"type": "string"}
                },
                "required": [],
                "additionalProperties": false
            },
        };

    const responseRaw = await getCompletion(
        [{role: "system", content: getEmbeddingSearchTermPrompt(question)}],
        {response_format: {type: "json_schema", json_schema: jsonSchema}});
    const response = JSON.parse(responseRaw);
    
    if ((response.error_description && response.error_description !== '') || !response.improved_embedding_query)
        throw new Error(`Bad question error: ${response.error_description}`);
    
    console.log(`Improved embedding query: ${response.improved_embedding_query}`);
    return response.improved_embedding_query;
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
        model: "text-embedding-ada-002", // $0.100 / 1M tokens
        // model: "text-embedding-3-large", // $0.130 / 1M tokens
        // model: "text-embedding-3-small", // $0.020 / 1M tokens
        encoding_format: "float",
        ...options
    });
    return response.data;
}

async function getEmbeddingsCachedVersion(inputArray, cacheKey, options = {}) {
    return await cacheApi.withCacheApi(cacheKey, () => getEmbeddings(inputArray, options));
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
