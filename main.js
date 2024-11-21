const that = this;

const SPACE_ID = "317748";       // Replace with actual space ID
const OFFSET = 0;                // Adjust as needed
const LIMIT = 50;                // Adjust as needed
const PAGE_SIZE = 100;

chrome.storage.local.get(['API_URL', 'ACCESS_TOKEN', 'OPENAI_KEY'], (result) => {
    that.API_URL = result.API_URL;
    that.ACCESS_TOKEN = result.ACCESS_TOKEN;
    that.OPENAI_KEY = result.OPENAI_KEY;
    
    if (!accessToken || !openAiKey) {
        console.error('Access Token или OpenAI Key не установлены.');
    }
});

// init secrets
(async () => {
  const css = (await import(chrome.runtime.getURL("styles.js"))).css;
  const stylesElement = document.createElement('template');
  stylesElement.innerHTML = css;
  document.body.appendChild(stylesElement.content.firstChild);
})();

// Создаем кнопку
const topButton = document.createElement('button');

// const button = document.createElement('button');
// button.innerText = 'Нажми меня!';
// button.className = 'v5-emotion-MuiButtonBase-root v5-emotion-MuiTab-root v5-emotion-MuiTab-textColorPrimary Mui-selected css-1mrn996';
// button.id = 'custom-button';
// button.style.position = 'fixed';
// button.style.bottom = '20px';
// button.style.right = '20px';
// button.style.zIndex = '10000';
// button.style.padding = '10px';
// button.style.border = '1px solid #ccc';
// button.style.borderRadius = '8px';
// button.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
// button.style.fontSize = '16px';
// button.style.cursor = 'pointer';

// Создаем инпут
const input = document.createElement('input');
input.type = 'text';
input.placeholder = 'Введите ваш запрос...';
input.className = 'v4-MuiInputBase-root v4-MuiOutlinedInput-root v5-v5294 v4-MuiInputBase-fullWidth v4-MuiInputBase-formControl v4-MuiInputBase-adornedStart v4-MuiOutlinedInput-adornedStart v5-v5295 v4-MuiInputBase-marginDense v4-MuiOutlinedInput-marginDense'; // Класс для стилизации
input.style.position = 'fixed';
input.style.bottom = '20px';
input.style.right = 'calc(20px + 120px)'; // Учитываем ширину кнопки (примерно 120px)
input.style.zIndex = '10000';
input.style.padding = '10px';
input.style.border = '1px solid #ccc';
input.style.borderRadius = '8px';
input.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
input.style.fontSize = '16px';

// const bottomButtonsHolder = document.createElement('div');
// bottomButtonsHolder.style.position = 'fixed';
// bottomButtonsHolder.style.bottom = '20px';
// bottomButtonsHolder.style.right = '20px';
// bottomButtonsHolder.style.zIndex = '10000';

// bottomButtonsHolder.appendChild(input);
// bottomButtonsHolder.appendChild(button);
// Добавляем инпут на страницу
// document.body.appendChild(bottomButtonsHolder);
document.body.appendChild(input);

window.addEventListener("load", (event) => {
  // todo: retry
  setTimeout(() => {
    topButton.className = 'v5-emotion-MuiButtonBase-root v5-emotion-MuiIconButton-root v5-emotion-MuiIconButton-sizeLarge css-1w8s6so';
    // newButton.innerText = 'AI search 🔎 ';
    topButton.innerText = 'AI search ';
    topButton.id = 'custom-header-button';
    topButton.style.fontSize = '1rem';
    topButton.style.border = '1px solid #848484';
    topButton.style.borderRadius = '0.5rem';

    const openaiLogo = document.createElement('template');
    openaiLogo.innerHTML =
        `<svg fill="#000000" width="1.2rem" height="1.2rem" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>OpenAI icon</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>`;
    topButton.appendChild(openaiLogo.content.firstChild);

    const headerEl = document.body.getElementsByTagName('header');
    const headerButtonsContainer = headerEl[0].children[0].children[1].children[1];
    headerButtonsContainer.insertBefore(topButton, headerButtonsContainer.firstChild);
  }, "2000");
});

// Добавляем обработчик клика
topButton.addEventListener('click', async () => {
    alert('Подождите, пока загрузятся данные');
    const kaitenData = await fetchKaitenCards();
    console.log("Kaiten Length:", kaitenData.length);
    console.log("Kaiten Cards:", kaitenData);

    // approach with using files and vector search
    // const fileId = await uploadFile(kaitenData);
    // console.log("fileId: ", fileId);

    // approach with direct asking chat gpt
    const question = input.value.trim(); // Получаем значение из инпута  
    const gptResponse = await askChatGpt(kaitenData, question);
    console.log("Gpt response:", gptResponse);
  
    // Очистка списка перед добавлением нового результата
    resultList.innerHTML = '';

    // Обработка ответа и отображение в списке
    try {
      const parsedResponse = JSON.parse(gptResponse);

      if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
          parsedResponse.forEach(card => {
              const listItem = document.createElement('li');
              listItem.textContent = `ID: ${card.id}, Title: ${card.title}`;
              listItem.style.marginBottom = '5px';
              resultList.appendChild(listItem);
          });
      } else {
          const noResults = document.createElement('li');
          noResults.textContent = 'Результатов не найдено.';
          resultList.appendChild(noResults);
      }
    } catch (error) {
        console.error('Ошибка при обработке ответа GPT:', error);
        const errorItem = document.createElement('li');
        errorItem.textContent = 'Ошибка обработки данных.';
        resultList.appendChild(errorItem);
    }
});

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


async function askChatGpt(context, question) {
  const systemPrompt =
    `
      Ты помощник, который находит нужные данные на основе предоставленных карточкек из доски с задачами.
      Пользователь описывает тебе искомую задачу. Найди и выдай список id и title карточек которые лучше всего отвечают искомому запросу.
      Результат должен быть в JSON формате вида [{"id": "...", "title": "..."}], или пустой массив если нужных карточек не нашлось.
      Не объясняй результат, дай сразу JSON данные. Не добавляй слово json в начале ответа
    `;

  const payload = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Вот карточки: \n```" + JSON.stringify(context) + "```\n\nВопрос пользователя: " + question }
    ]
    // ,
    // response_format: {
    //   type: "json_schema",
    //   json_schema: {
    //     name: "task_response",
    //     strict: true,
    //     schema: {
    //       type: "array",
    //       items: {
    //         type: "object",
    //         properties: {
    //           id: { type: "string", description: "Уникальный идентификатор задачи" },
    //           title: { type: "string", description: "Название задачи" }
    //         },
    //         required: ["id", "title"],
    //         additionalProperties: false
    //       }
    //     }
    //   }
    // }
  };

  console.log("payload:", payload);

  try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_KEY}`
          },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          console("openai response:", response.body)
          throw new Error(`Ошибка API OpenAI: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const gptAnswer = data.choices[0].message.content;
      return gptAnswer;

  } catch (error) {
      console.error("Ошибка при запросе к OpenAI API: ", error);
      throw error;
  }
}

async function fetchKaitenCards() {
    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawJson = await response.json();

        const extractedFieldsJson = rawJson.map(obj => ({
          id: obj.id,
          title: obj.title
        }));

        return extractedFieldsJson;
    } catch (error) {
        console.error("Error fetching Kaiten cards:", error);
        throw error
    }
}

async function uploadFile(fileData) {

    // Convert data to JSONL format
    const jsonlContent = fileData.map(entry => JSON.stringify(entry)).join('\n');
        
    // Create a Blob from the JSONL content
    const file = new Blob([jsonlContent], { type: "application/jsonl" });

    const formData = new FormData();
    formData.append("purpose", "assistants");
    formData.append("file", file);
  
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
// const fetchAllData = async () => {
//     let allData = [];  // Array to store all results
//     let offset = 0;    // Start offset
//     let hasMoreData = true;

//     while (hasMoreData) {
//         try {
//             // Construct URL with the current offset
//             const url = `${API_URL}?space_id=${SPACE_ID}&offset=${offset}&limit=${PAGE_SIZE}&archived=false`;

//             // Make the API call
//             const response = await fetch(url, {
//                 method: "GET",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": `Bearer ${ACCESS_TOKEN}`
//                 }
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data = await response.json();

//             // Add the current batch to the overall data
//             allData = allData.concat(data);

//             // Check if we should fetch more
//             ???
//             if (data.length < PAGE_SIZE) {
//                 hasMoreData = false;  // No more data to fetch
//             } else {
//                 offset += PAGE_SIZE; // Increment the offset
//             }
//         } catch (error) {
//             console.error("Error fetching data:", error);
//             break;
//         }
//     }

//     return allData;  // Return the aggregated data
// };



// chrome.storage.local.set({ fetchedData: data }, () => {
//     console.log("Данные сохранены в хранилище");
// });

// // Читаем данные из хранилища
// chrome.storage.local.get("fetchedData", result => {
//   console.log("Данные из хранилища:", result.fetchedData);
// });