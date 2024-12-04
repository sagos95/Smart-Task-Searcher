
async function createAssistant(model, options = {}) {
    const url = "https://api.openai.com/v1/assistants";

    // Подготовка тела запроса
    const payload = {
        model, // Обязательное поле
        ...options, // Дополнительные параметры
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_KEY}`,
                "OpenAI-Beta": "assistants=v2",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Assistant created:", data);
        return data; // Возвращаем объект помощника
    } catch (error) {
        console.error("Error creating assistant:", error);
        throw error;
    }
}

async function createThread(options = {}) {
    const url = "https://api.openai.com/v1/threads";

    // Подготовка тела запроса
    const payload = {
        ...options, // Дополнительные параметры
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_KEY}`,
                "OpenAI-Beta": "assistants=v2",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Thread created:", data);
        return data; // Возвращаем объект ветки
    } catch (error) {
        console.error("Error creating thread:", error);
        throw error;
    }
}

async function createMessage(threadId, role, content, options = {}) {
    const url = `https://api.openai.com/v1/threads/${threadId}/messages`;

    // Подготовка тела запроса
    const payload = {
        role, // Обязательное поле: роль отправителя
        content, // Обязательное поле: содержание сообщения
        ...options, // Дополнительные параметры
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_KEY}`,
                "OpenAI-Beta": "assistants=v2",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Message created:", data);
        return data; // Возвращаем объект сообщения
    } catch (error) {
        console.error("Error creating message:", error);
        throw error;
    }
}

async function createRun(threadId, assistantId, options = {}) {
    const url = `https://api.openai.com/v1/threads/${threadId}/runs`;

    // Подготовка тела запроса
    const payload = {
        assistant_id: assistantId, // Обязательное поле: ID помощника
        ...options, // Дополнительные параметры
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_KEY}`,
                "OpenAI-Beta": "assistants=v2",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Run created:", data);
        return data; // Возвращаем объект запуска
    } catch (error) {
        console.error("Error creating run:", error);
        throw error;
    }
}
async function listMessages(threadId, queryParams = {}) {
    // Формирование URL с query-параметрами
    const url = new URL(`https://api.openai.com/v1/threads/${threadId}/messages`);
    Object.keys(queryParams).forEach((key) =>
        url.searchParams.append(key, queryParams[key])
    );

    try {
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${OPENAI_KEY}`,
                "OpenAI-Beta": "assistants=v2",
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Messages retrieved:", data);
        return data; // Возвращаем список сообщений
    } catch (error) {
        console.error("Error listing messages:", error);
        throw error;
    }
}

async function createVectorStore(apiKey, options = {}) {
    const url = "https://api.openai.com/v1/vector_stores";

    const payload = {
        ...options, // Передаем параметры запроса
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "OpenAI-Beta": "assistants=v2", // Добавляем заголовок для бета-версии API
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Vector store created:", data);
        return data; // Возвращаем объект векторного хранилища
    } catch (error) {
        console.error("Error creating vector store:", error);
        throw error;
    }
}

async function processKaitenData(question) {
    try {
        // Шаг 1: Выгрузка карточек из Kaiten
        const kaitenData = await fetchKaitenAllData();

        // Шаг 2: Загрузка файла в OpenAI
        console.log("Uploading Kaiten cards as a file...");
        const fileId = await uploadFile(kaitenData);
        console.log("File uploaded with ID:", fileId);

        // Шаг 3: Создание векторного хранилища
        console.log("Creating vector store...");
        const vectorStore = await createVectorStore(OPENAI_KEY, {
            file_ids: [fileId],
            name: "Kaiten Vector Store",
            chunking_strategy: {
                // type: "auto",
                type: "static",
                static: {
                    max_chunk_size_tokens: 100,
                    chunk_overlap_tokens: 50
                }
            },
            metadata: {
                source: "Kaiten",
                purpose: "Task card search",
            },
            expires_after: {
                anchor: "last_active_at",
                days: 1
            }
        });
        // todo: где-то в доках майков рекомендовалось вручную пополлить и дождаться гарантии того что вектор стор создался
        const vectorStoreId = vectorStore.id;
        console.log("Vector store created with ID:", vectorStoreId);

        // Шаг 4: Создание ассистента
        console.log("Creating assistant...");
        // todo: иногда чуваки прям в промпт пишут "при поиске по файлам юзай не более 5 топ результатов"
        const assistant = await createAssistant("gpt-4o", {
            name: "Kaiten Assistant",
            description: "Assistant for searching Kaiten task cards.",
            instructions: `Ты помощник, который находит нужные данные на основе предоставленных карточек из доски с задачами.
      Пользователь описывает тебе искомую задачу. Найди и выдай список id и title карточек которые лучше всего отвечают искомому запросу.
      Результат должен быть в JSON формате вида [{"id": "...", "title": "..."}], или пустой массив если нужных карточек не нашлось.
      Не объясняй результат, дай сразу JSON данные. Не добавляй слово json в начале ответа`,
            tools: [
                {
                    type: "file_search",
                    file_search:
                        {
                            max_num_results: 5,
                            // ranking_options: { score_threshold: 0.5 }
                        }
                }
            ],
            tool_resources: {
                file_search: { vector_store_ids: [vectorStoreId] }
            }
        });
        const assistantId = assistant.id;
        console.log("Assistant created with ID:", assistantId);

        // Шаг 5: Создание ветки
        console.log("Creating thread...");
        const thread = await createThread({
            messages: [{ role: "user", content: question }],
            tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } },
        });
        const threadId = thread.id;
        console.log("Thread created with ID:", threadId);

        // todo: не нужно, уже создано сразу в thread
        // Шаг 6: Создание сообщения
        // console.log("Adding user message to thread...");
        // await createMessage(threadId, "user", question);

        // Шаг 7: Создание запуска
        console.log("Creating run for the thread...");
        const run = await createRun(threadId, assistantId, {
            temperature: 0.7,
            top_p: 0.9,
            stream: false,
            max_prompt_tokens: 10000,
            max_completion_tokens: 10000,
            // truncation_strategy: {
            //  
            // }
            tools: [
                {
                    type: "file_search",
                    file_search:
                        {
                            max_num_results: 5,
                            // ranking_options: { score_threshold: 0.5 }
                        }
                }
            ]
        });

        const ignoredStatuses = ["queued", "in_progress"];
        await waitForRunCompletion(threadId, run.id, ignoredStatuses);

        // Шаг 8: Получение списка сообщений
        console.log("Fetching messages from thread...");
        const messages = await listMessages(threadId, { limit: 50 });
        console.log("Messages retrieved:", messages);

        // Возвращаем список сообщений
        return messages;

    } catch (error) {
        console.error("Error during process:", error);
        throw error;
    }
}


async function uploadFile(fileData) {

    // Convert data to JSONL format
    const jsonlContent = fileData.map(entry => JSON.stringify(entry)).join('\n');
    console.log("JSONL Kaiten cards", jsonlContent)
    // Create a Blob from the JSONL content
    const file = new Blob([jsonlContent], { type: 'text/plain' });

    const formData = new FormData();
    formData.append("purpose", "assistants");
    formData.append("file", file, "kaiten_cards.txt");

    try {
        const response = await fetch('https://api.openai.com/v1/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_KEY}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Файл успешно загружен:', data);
            return data.id;
        } else {
            console.error('Ошибка загрузки файла:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
    }
}