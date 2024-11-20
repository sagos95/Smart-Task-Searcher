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
button.id = 'custom-button';
button.style.position = 'fixed';
button.style.bottom = '20px';
button.style.right = '20px';
button.style.zIndex = '10000';

// Добавляем обработчик клика
button.addEventListener('click', async () => {
    alert('Подождите, пока загрузятся данные');
    const kaitenData = await fetchKaitenCards();
    console.log("Kaiten Length: ", kaitenData.length);
    console.log("Kaiten Cards: ", kaitenData);
    const fileId = await uploadFile(kaitenData);
    console.log("fileId: ", fileId);

});

// Добавляем кнопку на страницу
document.body.appendChild(button);

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