// noinspection ExceptionCaughtLocallyJS

const that = this;

const PAGE_SIZE = 100;

chrome.storage.local.get(['API_URL', 'ACCESS_TOKEN', 'OPENAI_KEY'], (result) => {
    that.API_URL = result.API_URL;
    that.ACCESS_TOKEN = result.ACCESS_TOKEN;
    that.OPENAI_KEY = result.OPENAI_KEY;
});

// loaded from styles.js
that.components = {
  curtain: undefined,
  popupSearchBar: undefined, 
  searchBarId: undefined,
  createElement: (parent, elementTemplate) => {
    const el = document.createElement('template');
    el.innerHTML = elementTemplate;
    parent.appendChild(el.content);
    return el;
  }
};

// imports
(async () => {
  const importAsync = (fileName) => import(chrome.runtime.getURL(fileName));
  
  const tabUrl = await getCurrentTabUrl()
  that.SPACE_ID = extractSpaceId(tabUrl)

  const styles = await importAsync("styles.js");
  const stylesElement = document.createElement('template');
  stylesElement.innerHTML = styles.css;
  document.body.appendChild(stylesElement.content);

  that.components.curtain = styles.curtain;
  that.components.popupSearchBar = styles.popupSearchBar;
  that.components.searchBarId = styles.searchBarId;

  const openaiRunnerAwaiter = await importAsync("openai-runner-awaiter.js");
  that.waitForRunCompletion = openaiRunnerAwaiter.waitForRunCompletion;

  const openaiCompletions = await importAsync("openai-completions.js");
  that.testCompletion = openaiCompletions.testCompletion;
  that.executeSearch = openaiCompletions.executeSearch;
})();

// Создаем кнопку
const topButton = document.createElement('button');

window.addEventListener("load", () => {
  // todo: retry
  setTimeout(() => {
    topButton.className = 'v5-v559 css-1hwqkh2';
    topButton.id = 'custom-header-button';
    const innerButtonContent = document.createElement('template');
    innerButtonContent.innerHTML =
      `
        <div style="display: flex;">
          <span style="margin-right: 0.5rem" >AI search</span>
          <div><svg style="vertical-align: sub" fill="#000000" width="1rem" height="1rem" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg></div>
        </div>
      `;
    topButton.appendChild(innerButtonContent.content);

    const headerEl = document.body.getElementsByTagName('header');
    const headerButtonsContainer = headerEl[0].children[0].children[1].children[1];
    headerButtonsContainer.insertBefore(topButton, headerButtonsContainer.firstChild);
  }, "2000");
});

topButton.addEventListener('click', async () => {
    if (document.getElementById("popup-search-window"))
        return;
    
    const curtain = components.createElement(document.body, that.components.curtain);
    const window = components.createElement(document.body, that.components.popupSearchBar);
    const searchButton = document.getElementById("popup-search-button");
    searchButton.addEventListener("click", onSearchButtonClick);
    curtain.addEventListener("click", onCurtainClick);
});

const onCurtainClick = async () => {
    console.log("curtain.remove()");
    curtain.remove();
    window.remove();
}

const onSearchButtonClick = async () => {
  const input = document.getElementById(that.components.searchBarId);
  const question = input.value.trim();
  if (!question) {
    alert("Введите вопрос!");
    return;
  }

  alert("Обрабатываем запрос, подождите...");

  const kaitenData = await fetchKaitenAllData();
  await executeSearch(question, kaitenData, SPACE_ID);
  
  return;
  // todo: assistants code:
  // try {
  //   const messages = await processKaitenData(question);
  //   console.log("Final messages:", messages);
  //
  //   // Отображение сообщений
  //   resultList.innerHTML = ""; // Очистка списка
  //   messages.data.forEach((msg) => {
  //     try {
  //       const listItem = document.createElement("li");
  //       listItem.textContent = `Role: ${msg.role}, Content: ${msg.content[0].text.value}`;
  //       resultList.appendChild(listItem);
  //     } catch (error) {
  //       console.error("Ошибка создания элемента ответа:", error);
  //       alert("Произошла ошибка при обработке данных.");
  //     }
  //   });
  // } catch (error) {
  //   console.error("Ошибка обработки:", error);
  //   alert("Произошла ошибка при обработке данных.");
  // }
};

// Добавляем кнопку на страницу
document.body.appendChild(topButton);

// Создаем список для отображения результата
const resultList = document.createElement('ul');
resultList.style.position = 'fixed';
resultList.style.bottom = '80px'; // Расположим над кнопкой и инпутом
resultList.style.right = '20px';
resultList.style.zIndex = '10000';
resultList.style.padding = '10px 30px;';
resultList.style.border = '1px solid #ccc';
resultList.style.borderRadius = '8px';
resultList.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
resultList.style.backgroundColor = '#fff';
resultList.style.maxHeight = '200px';
resultList.style.overflowY = 'auto';
resultList.style.fontSize = '14px';

// Добавляем список на страницу
document.body.appendChild(resultList);

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

// for auto-pagination:
const fetchKaitenAllData = async () => {
    console.log("Fetching Kaiten cards...");
    let allData = [];  // Array to store all results
    let offset = 0;    // Start offset
    let hasMoreData = true;

    while (hasMoreData) {
        try {
            // Construct URL with the current offset
            const url = `${API_URL}?space_id=${that.SPACE_ID}&offset=${offset}&limit=${PAGE_SIZE}&archived=false`;

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
                title: obj.title
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

async function getCurrentTabUrl(){
  return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "GET_TAB_URL" }, (response) => {
          if (chrome.runtime.lastError || response.error) {
              reject(chrome.runtime.lastError || response.error);
          } else {
              resolve(response.url);
          }
      });
  });
}

function extractSpaceId(url){
  const match = url.match(/space\/(\d+)/);
  return match ? match[1] : null;
}

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