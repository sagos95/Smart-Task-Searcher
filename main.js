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
})();

// Создаем кнопку
const topButton = document.createElement('button');

window.addEventListener("load", () => {
  // todo: retry
  setTimeout(() => {
      const topButton = document.createElement('button');
      topButton.className = 'v5-v559 css-1hwqkh2';
      topButton.id = 'custom-header-button';
      const innerButtonContent = document.createElement('template');
      innerButtonContent.innerHTML = `
    <div style="display: flex;">
      <span style="margin-right: 0.5rem">AI search</span>
      <div>
        <svg style="vertical-align: sub" fill="#000000" width="1rem" height="1rem" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
      </div>
    </div>
  `;
      topButton.appendChild(innerButtonContent.content);

      // Добавляем в header
      const headerEl = document.body.getElementsByTagName('header');
      const headerButtonsContainer = headerEl[0].children[0].children[1].children[1];
      headerButtonsContainer.insertBefore(topButton, headerButtonsContainer.firstChild);

      // Обработчик кнопки
      topButton.addEventListener('click', () => {
          document.getElementById('custom-search-modal').style.display = 'block';
      });
  }, "8000");
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

// Создаем модальное окно
const createSearchModal = () => {
    const modal = document.createElement('div');
    modal.id = 'custom-search-modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.top = '20%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = '638px';
    modal.style.backgroundColor = 'white';
    modal.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    modal.style.borderRadius = '10px';
    modal.style.zIndex = '10000';
    modal.style.padding = '20px';

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
      <div id="custom-search-result" style=" 
          overflow-x: auto; 
          padding: 10px; 
          border: 1px solid #ccc; 
          border-radius: 5px; 
          background-color: #f9f9f9; 
          display: none; 
          font-size: 14px;">
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
        result.innerHTML = `<pre>${searchResults}</pre>`;
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