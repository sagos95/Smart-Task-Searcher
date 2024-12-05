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
    openAiIcon: undefined,
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
    that.components.openAiIcon = styles.openAiIcon;

    const openaiRunnerAwaiter = await importAsync("openai-runner-awaiter.js");
    that.waitForRunCompletion = openaiRunnerAwaiter.waitForRunCompletion;

    const openaiCompletions = await importAsync("openai-completions.js");
    that.testCompletion = openaiCompletions.testCompletion;
    that.executeSearch = openaiCompletions.executeSearch;
})().then(() => {
    // Создаем модальное окно
    const createSearchModal = () => {
        const modal = document.createElement('div');
        modal.id = 'custom-search-modal';
        modal.style.position = 'fixed';
        modal.style.display = 'none';
        modal.style.top = '20%'; // Центрирование
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -20%)'; // Центрирование
        modal.style.width = '638px';
        modal.style.backgroundColor = 'white';
        modal.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        modal.style.borderRadius = '10px';
        modal.style.zIndex = '10000';
        modal.style.padding = '20px';
        modal.style.maxHeight = '80vh'; // Максимальная высота окна - 80% от высоты экрана
        modal.style.overflowY = 'auto'; // Вертикальная прокрутка только при переполнении
        modal.style.boxSizing = 'border-box'; // Учитывает padding в размерах

        modal.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <!-- Заголовок и кнопка закрытия -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 18px; font-weight: bold; color: #666666; text-transform: uppercase;">AI поиск</div>
        <button id="custom-search-close" style="background: none; color: #757575; border: none; font-size: 36px; cursor: pointer;">&times;</button>
      </div>

      <!-- Поле ввода -->
      <div style="display: flex; gap: 10px;">
        <input id="custom-search-input" type="text" placeholder="Опишите своими словами, какую карточку хотите найти..." style="
            flex-grow: 1; 
            padding: 8px; 
            border: none; 
            border-radius: 4px;
            background-color: #e7e7e7; 
            font-size: 16px;">
        <button id="custom-search-button" style="
            padding: 8px 12px;
            background-color: transparent;
            color: rgba(0, 0, 0, 0.87);
            text-transform: uppercase;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Roboto', sans-serif;
            font-weight: 500;
            line-height: 1.75;
            ">
            ${that.components.openAiIcon}
            Искать
        </button>
      </div>

      <!-- Лоадер -->
      <div class="openai-loader" id="custom-search-loader" style="display: none; text-align: center;">
      </div>

      <!-- Результат -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
          <div id="custom-search-result" style="
              width: 100%;
              min-height: fit-content;
              overflow: auto; 
              height: 150px; 
              padding: 10px; 
              border: none; 
              border-radius: 4px; 
              background-color: #f9f9f9; 
              font-size: 14px;  
              resize: none; /* Отключить возможность изменения размера */
              white-space: pre-wrap; 
              word-break: break-word;
          " readonly></div>
      </div>
    </div>
  `;

        document.body.appendChild(modal);

        // Добавляем обработчик закрытия
        document.getElementById('custom-search-close').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        return modal;
    };

    const modal = createSearchModal();

    // Создаем кнопку
    const topButton = document.createElement('button');

    window.addEventListener("load", async () => {
        // todo: retry
        
        // Ждем, пока элемент появится
        const headerButtonsContainer = await waitForElement('header > div > div:nth-child(2) > div:nth-child(2)', 500, 10000);

        const topButton = document.createElement('button');
        topButton.className = 'v5-v559 css-1hwqkh2';
        topButton.id = 'custom-header-button';
        const innerButtonContent = document.createElement('template');
        innerButtonContent.innerHTML = `
            <div style="display: flex;">
              <span style="margin-right: 0.5rem">AI search</span>
              <div>
                ${that.components.openAiIcon}
              </div>
            </div>
          `;
        topButton.appendChild(innerButtonContent.content);

        // Добавляем в header
        headerButtonsContainer.insertBefore(topButton, headerButtonsContainer.firstChild);

        // Обработчик кнопки
        topButton.addEventListener('click', () => {
            document.getElementById('custom-search-modal').style.display = 'block';
        });
        
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


    // Обработчик кнопки поиска
    document.getElementById('custom-search-button').addEventListener('click', async () => {
        const input = document.getElementById('custom-search-input');
        const loader = document.getElementById('custom-search-loader');
        const result = document.getElementById('custom-search-result');

        const question = input.value.trim();
        if (!question) {
            alert("Введите вопрос!");
            return;
        }

        // Показать лоадер и скрыть результат
        loader.style.display = 'block';
        result.style.display = 'none';
        result.innerHTML = '';

        try {
            const kaitenData = await fetchKaitenAllData();
            const searchResults = await executeSearch(question, kaitenData, SPACE_ID);

            // Показать результат
            result.innerHTML = `<pre style="white-space: break-spaces;max-height: 40rem;overflow-x: scroll;">${searchResults}</pre>`;
            result.style.display = 'block';
        } catch (error) {
            result.innerHTML = `<span style="color: red;">Ошибка: ${error.message}</span>`;
            result.style.display = 'block';
        } finally {
            // Скрыть лоадер
            loader.style.display = 'none';
        }
    });

    // Добавляем кнопку на страницу
    document.body.appendChild(topButton);

    const waitForElement = (selector, interval = 500, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkExist = setInterval(() => {
                const element = document.querySelector(selector);

                if (element) {
                    clearInterval(checkExist);
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkExist);
                    reject(new Error(`Элемент с селектором "${selector}" не найден за ${timeout} мс.`));
                }
            }, interval);
        });
    };

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
});

async function getCurrentTabUrl() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: "GET_TAB_URL"}, (response) => {
            if (chrome.runtime.lastError || response.error) {
                reject(chrome.runtime.lastError || response.error);
            } else {
                resolve(response.url);
            }
        });
    });
}

function extractSpaceId(url) {
    const match = url.match(/space\/(\d+)/);
    return match ? match[1] : null;
}