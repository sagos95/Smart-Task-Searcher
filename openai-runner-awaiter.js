
export async function test() {
    alert("test")
}

export async function waitForRunCompletion(threadId, runId, ignoredStatuses = [], timeoutMs = 60000, intervalMs = 1000) {
    const startTime = Date.now();
    const url = `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`;

    while (Date.now() - startTime < timeoutMs) {
        try {
            const response = await fetch(url, {
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
            console.log("Run data retrieved:", data);
            // Check the status
            if (ignoredStatuses.includes(data.status) === false) {
                console.log(`Run completed with status: ${data.status}`);
                return data;
            }

            if (data.status === "incomplete") {
                console.log(`Run completed with status: ${data.status}`);
                throw new Error(`Run completed with status: ${data.status}`);
            }

            console.log(`Current status: ${data.status}. Waiting for any status except ${ignoredStatuses}...`);
        } catch (error) {
            console.error("Error while checking run status:", error);
            throw error;
        }
        
        // Wait for the specified interval before polling again
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Timeout waiting for run to reach any status except ${ignoredStatuses}`);
}