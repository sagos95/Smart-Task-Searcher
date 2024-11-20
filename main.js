import {
  API_URL,
  ACCESS_TOKEN,
  OPENAI_KEY,
  nash_failik
} from './local-settings.js';

const SPACE_ID = "317748"; // Replace with actual space ID
const OFFSET = 0;                // Adjust as needed
const LIMIT = 50;                // Adjust as needed
const PAGE_SIZE = 100;


// Создаем кнопку
const button = document.createElement('button');
button.innerText = 'Нажми меня!';
button.className = 'v5-emotion-MuiButtonBase-root v5-emotion-MuiTab-root v5-emotion-MuiTab-textColorPrimary Mui-selected css-1mrn996';
button.id = 'custom-button';
button.style.position = 'fixed';
button.style.bottom = '20px';
button.style.right = '20px';
button.style.zIndex = '10000';
button.style.padding = '10px';
button.style.border = '1px solid #ccc';
button.style.borderRadius = '8px';
button.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
button.style.fontSize = '16px';
button.style.cursor = 'pointer';

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
document.body.appendChild(button);

window.addEventListener("load", (event) => {
  console.log("page is fully loaded");

  // todo: retry
  setTimeout(() => {
    const newButton = document.createElement('button');
    newButton.className = 'v5-emotion-MuiButtonBase-root v5-emotion-MuiIconButton-root v5-emotion-MuiIconButton-sizeLarge css-1w8s6so';
    newButton.innerText = 'AI search 🔎 ';
    newButton.id = 'custom-header-button';
    newButton.style.fontSize = '1rem';
    newButton.style.border = '1px solid #848484';
    newButton.style.borderRadius = '0.5rem';

    const headerEl = document.body.getElementsByTagName('header');
    const headerButtonsContainer = headerEl[0].children[0].children[1].children[1];
    // headerButtonsContainer.appendChild(newButton);
    headerButtonsContainer.insertBefore(newButton, headerButtonsContainer.firstChild);
  }, "2000");
});

// Добавляем обработчик клика
button.addEventListener('click', async () => {
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
document.body.appendChild(button);

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