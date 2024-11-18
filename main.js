const SPACE_ID = "317748"; // Replace with actual space ID
const OFFSET = 0;                // Adjust as needed
const LIMIT = 50;                // Adjust as needed
const PAGE_SIZE = 100;
// const API_URL = `https://YOUR_COMPANY.kaiten.ru/api/latest/cards?space_id=${SPACE_ID}&offset=${OFFSET}&limit=${LIMIT}&archived=false`;
const API_URL = `https://YOUR_COMPANY.kaiten.ru/api/latest/cards`;
const ACCESS_TOKEN = "??"
const OPENAI_KEY = "??"


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

        return await response.json();
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
