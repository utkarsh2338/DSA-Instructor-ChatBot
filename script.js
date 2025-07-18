
const API_KEY = "AIzaSyDjFZ1p1pPS8cA8cVFyF-4bCydr8EuUfDk"; // Your API Key
const MODEL_NAME = "gemini-2.5-flash";


const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const thinkingIndicator = document.getElementById("thinking-indicator");
const newChatBtn = document.getElementById("new-chat-btn"); // NEW: Get the button

// --- CONVERSATION HISTORY ---
let history = []; 


function showWelcomeMessage() {
  chatBox.innerHTML = `
        <div class="message bot-message">
            <div class="message-content">
                <p>Hello! I am your DSA instructor. Ask me anything about data structures and algorithms. For example, "What is a linked list?" or "Give me the C++ code for Bubble Sort."</p>
            </div>
        </div>
    `;
}


function startNewChat() {
  
  if (
    confirm(
      "Are you sure you want to start a new chat? Your current conversation will be lost."
    )
  ) {
    history = []; // Reset the conversation history
    showWelcomeMessage(); // Show the welcome message again
    userInput.disabled = false; // Ensure input is enabled
    userInput.focus(); // Focus on the input field
    thinkingIndicator.classList.add("hidden"); // Hide thinking indicator
  }
}

// (The rest of the JS functions are the same as before)

function appendUserMessage(text) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", "user-message");
  messageElement.innerHTML = `<div class="message-content"><p>${text}</p></div>`;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function createBotMessageElement() {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", "bot-message");
  const contentElement = document.createElement("div");
  contentElement.classList.add("message-content");
  const cursorSpan = document.createElement("span");
  cursorSpan.classList.add("typing-cursor");
  cursorSpan.textContent = "▋";
  contentElement.appendChild(cursorSpan);
  messageElement.appendChild(contentElement);
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
  return contentElement;
}

async function handleChatSubmit(event) {
  event.preventDefault();
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  appendUserMessage(userMessage);
  history.push({ role: "user", parts: [{ text: userMessage }] });

  userInput.value = "";
  thinkingIndicator.classList.remove("hidden");
  userInput.disabled = true;

  try {
    await streamBotResponse();
  } catch (error) {
    console.error("Error fetching bot response:", error);
    const errorElement = createBotMessageElement();
    errorElement.innerHTML = `<p>Sorry, I ran into an error. Please check the console and make sure your API key is correct ${error.message}.</p>`;
  } finally {
    thinkingIndicator.classList.add("hidden");
    userInput.disabled = false;
    userInput.focus();
  }
}

async function streamBotResponse() {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:streamGenerateContent?key=${API_KEY}&alt=sse`;
  const requestBody = {
    /* ... same as before ... */
  };
  // ... rest of the function is identical to the previous version
const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        contents: history,
        systemInstruction: {
            role: "system",
            parts: [
                {
                    text: "You are a helpful DSA instructor. Always provide detailed, step-by-step explanations, include relevant examples, and show complete C++ code where applicable. Your answers should be thorough and educational, not brief.",
                },
            ],
        },
        generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048, // Increased for more detailed responses
            stopSequences: [],
        },
    }),
});
  // ... all the streaming logic ...
  // --- THIS PART IS UNCHANGED ---
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed with status ${response.status}: ${errorText}`
    );
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullBotMessage = "";
  const botMessageContentElement = createBotMessageElement();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const jsonStr = line.substring(6);
          if (jsonStr.trim() === "[DONE]") continue;
          const jsonData = JSON.parse(jsonStr);
          const textPart = jsonData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textPart) {
            fullBotMessage += textPart;
            botMessageContentElement.innerHTML = marked.parse(fullBotMessage);
            chatBox.scrollTop = chatBox.scrollHeight;
          }
        } catch (error) {
          // Optionally log error
        }
      }
    }
  }
  botMessageContentElement.querySelector(".typing-cursor")?.remove();
  addCopyButtonsToCodeBlocks(botMessageContentElement);
  history.push({ role: "model", parts: [{ text: fullBotMessage }] });
}

function addCopyButtonsToCodeBlocks(container) {
  /* ... same as before ... */
}

// --- EVENT LISTENERS ---
chatForm.addEventListener("submit", handleChatSubmit);
newChatBtn.addEventListener("click", startNewChat); // NEW: Listen for clicks on the new chat button

// --- INITIALIZATION ---
showWelcomeMessage(); // NEW: Call this function on page load
