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

/**
 * Эта функция вызывает GPT, чтобы понять, какие параметры фильтрации нужны:
 * - например, "ответственные" (responsibles),
 * - годы (years),
 * - слова, которые надо исключить (exclude),
 * - "чистый" запрос (cleanQuery) для эмбеддингов.
 * В реальном проекте вы можете усложнить этот JSON – всё зависит от ваших нужд.
 */
async function parseUserSearch(question) {
    const systemPrompt = `
      Ты – помощник, который разбирает текст запроса пользователя и превращает его в JSON-структуру:
      {
        "responsibles": ["...","..."],  // все упомянутые люди
        "years": [2023, 2024],          // все упомянутые годы
        "exclude": ["...","..."],       // ключевые слова, которые надо исключить
        "cleanQuery": "..."            // текст, который можно использовать для эмбеддингов
      }
      
      Важный момент: если пользователь использует разговорные формы имён, 
      постарайся раскрыть их и добавить несколько возможных синонимов. 
      Например, если пользователь говорит "Лёша" или "Леша", 
      то нужно в "responsibles" добавить и "Лёша Васнецов" (как он сказал),
      и "Alexey Vasnetsov" (если понимаешь, что это одно и то же лицо) и еще несколько вариантов написания на английском
      чтобы учитывались к примеру варианты имен Alexey и Aleksei и Aleksey и т.д.
      Делай так со всеми именами
      Итоговый JSON может содержать в "responsibles" все варианты, чтобы не потерять смысл.
      
      Если чего-то нет, возвращай пустые массивы/пустую строку. 
      Ответ строго в формате JSON, без текста снаружи. Не нужно добавлять markdown и прочее. Строго в формате JSON
    `;

    // Вызываем GPT (через ваш существующий метод getCompletion).
    // Он вернёт нам строку, которую попытаемся JSON.parse.
    try {
        const responseRaw = await getCompletion([
            { role: "system", content: systemPrompt },
            { role: "user", content: question }
        ]);
        const parsed = JSON.parse(responseRaw);

        return {
            responsibles: Array.isArray(parsed.responsibles) ? parsed.responsibles : [],
            years: Array.isArray(parsed.years) ? parsed.years : [],
            exclude: Array.isArray(parsed.exclude) ? parsed.exclude : [],
            cleanQuery: parsed.cleanQuery || question
        };
    } catch (e) {
        // Если что-то пошло не так (GPT не вернул валидный JSON и т.п.),
        // просто вернём пустые массивы и исходный question.
        return {
            responsibles: [],
            years: [],
            exclude: [],
            cleanQuery: question
        };
    }
}

/**
 * Фильтрация карточек на основе извлечённых параметров:
 * 1) Если указаны конкретные "responsibles", оставляем только те, у кого поле card.responsible
 *    содержит хотя бы одно из имён.
 * 2) Если указаны годы, проверяем start_work_at и completed_at.
 * 3) Если есть exclude, исключаем карточки, в title/description которых встречаются эти слова.
 */
function filterCardsByParams(cards, { responsibles, years, exclude }) {
    return cards.filter(card => {
        // 1) Проверяем ответственных
        if (responsibles.length > 0) {
            const cardResp = (card.responsible || "").toLowerCase();
            // Карточка подходит, если в её responsible упоминается хотя бы один из responsibles
            const matchSomeone = responsibles.some(r => cardResp.includes(r.toLowerCase()));
            if (!matchSomeone) return false;
        }

        // 2) Проверяем годы. Для простоты: считаем, что 
        //    если start_work_at или completed_at попадает в какой-то из указанных годов,
        //    то задача проходит.
        if (years.length > 0) {
            const startYear = card.start_work_at ? new Date(card.start_work_at).getFullYear() : null;
            const endYear = card.completed_at ? new Date(card.completed_at).getFullYear() : null;
            // Если оба null, значит карточка вообще не имеет дат
            if (!startYear && !endYear) return false;

            // Если год старта или завершения попадает в указанные years – ок
            const inRange = (startYear && years.includes(startYear))
                || (endYear && years.includes(endYear));
            if (!inRange) return false;
        }

        // 3) exclude. Если в title+description есть хоть одно стоп-слово, исключаем
        if (exclude.length > 0) {
            const text = (card.title + " " + (card.description || "")).toLowerCase();
            for (let stopWord of exclude) {
                if (text.includes(stopWord.toLowerCase())) {
                    return false;
                }
            }
        }

        return true;
    });
}

export async function executeSearch(question, dataToSearch, spaceId) {
    // 1) Разбираем запрос в структуру (responsibles, years, exclude, cleanQuery)
    const { responsibles, years, exclude, cleanQuery } = await parseUserSearch(question);

    // 2) Фильтруем карточки по этим параметрам
    const filteredCards = filterCardsByParams(dataToSearch, { responsibles, years, exclude });

    // 3) Семантический поиск делаем по отфильтрованным (а не по всем)
    //    Сначала получаем "улучшенный" запрос для эмбеддингов (через ваш уже существующий метод):
    const improvedEmbeddingQuery = await getImprovedEmbeddingQuery(cleanQuery);

    // 4) Получаем эмбеддинг для запроса
    const queryEmbedding = await getEmbeddingsCachedVersion([improvedEmbeddingQuery], `text_${improvedEmbeddingQuery}`);

    // 5) Получаем эмбеддинги для всех отфильтрованных карточек
    const cardTexts = filteredCards.map(d => JSON.stringify(d));
    const cardEmbeddings = await getEmbeddings(cardTexts);

    // 6) Ищем топ-N похожих (например, 100)
    const nearestEmbeddings = findTopNCosine(cardEmbeddings, queryEmbedding[0], 100);
    console.log("Nearest embeddings:", nearestEmbeddings);

    // 8) Собираем контекст для prompt
    const promptAugmentation = nearestEmbeddings.reduce((sum, embedding) => {
        const card = filteredCards[embedding.vector.index];
        return card
            ? sum + `${JSON.stringify(card)}\n\n\n`
            : sum;
    }, '');

    // 9) Запрашиваем у GPT итоговый ответ (список ссылок и пояснений)
    const response = await getCompletion([
        {
            role: "system",
            content: getSearchPrompt(question, promptAugmentation, spaceId)
        }
    ]);
    console.log("Final response:", response);

    return response;
}


// ================================= Chat GPT logic (не меняем)

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


// ================================= Semantic search (не меняем)

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


// ================================= OpenAI API (не меняем)

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
    });
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

