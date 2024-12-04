// noinspection ExceptionCaughtLocallyJS
// noinspection JSUnresolvedReference

const that = {};

chrome.storage.local.get(['API_URL', 'ACCESS_TOKEN', 'OPENAI_KEY'], (result) => {
    that.API_URL = result.API_URL;
    that.ACCESS_TOKEN = result.ACCESS_TOKEN;
    that.OPENAI_KEY = result.OPENAI_KEY;
});

export async function executeSearch(question, dataToSearch, spaceId) {
    const queryEmbedding = await getEmbeddings([question]);
    
    // todo: метод для конвертации карточки с названием и дескрипшном в одну строку
    // todo: запихнуть это вместе в эмбеддинг, а не только тайтл
    // todo: можно кэшировать в локал сторадже все эмбеддинги
    
    const cardTexts = dataToSearch.map(d => d.title);
    const cardEmbeddings = (await getEmbeddings(cardTexts));//.sort(e => -e.index);
    
    const nearestEmbeddings = findTopNCosine(cardEmbeddings, queryEmbedding[0], 100);
    console.log("Nearest embeddings:", nearestEmbeddings);
    // nearestEmbeddings: { similarity:, vector: {index: !, embedding:[]}}
    const promptAugmentation = nearestEmbeddings.reduce((sum, embedding) => {
        const card = dataToSearch[embedding.vector.index];
        return card 
            ? sum + `- Card Id: ${card.id}; Card title: "${card.title}"; Description: ${card.description}\n\n\n`
            : sum;
    }, '');
    
    const response = await getCompletion([
        {role: "system", content: getSearchPrompt(question, promptAugmentation, spaceId)}
    ]);
    console.log("Final response:", response);
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
        и оформи итоговый ответ с указанием ссылок на карточки в следующем виде md разметки (т.е. сделай сам title
        карточек кликабельными ссылками):
        "
        [TITLE_КАРТОЧКИ_1](${urlForCards}/ID_КАРТОЧКИ_1)
        [TITLE_КАРТОЧКИ_2](${urlForCards}/ID_КАРТОЧКИ_2)
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