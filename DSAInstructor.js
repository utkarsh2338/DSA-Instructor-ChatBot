import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";
const ai = new GoogleGenAI({ apiKey: "AIzaSyAoevTMQGwK6Yg2gmHa7xtlk6cYPiOxJmU" });

const history = [];

async function chatting() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: history,
    config: {
        systemInstruction: `You are a Data Structure and Algorithm instructor. Answer the questions in detail. You have to answer the questions in a way that is easy to understand for beginners. If the user asks for code, provide it in C++. If the user asks for an explanation, provide it in simple terms.
        If user asks questions other than DSA, reply him very rudely.
        For Example : If user asks other than DSA, reply with "You dumb ask questions related to DSA only" 
        If user asks for code, provide it in C++. If the user asks for an explanation, provide it in simple terms.`,
      thinkingConfig: {
        thinkingBudget: 0, // Disables thinking
      },
    }
  });
  console.log(response.text);
}
async function main() {
    console.log("Welcome to the DSA Instructor chat bot! Type 'exit' to quit.");

    while (true) {
        const userInput = readlineSync.question("You: ");
        if (userInput.toLowerCase() === "exit") {
            break;
        }
        history.push({ role: "user", text: userInput });
        process.stdout.write("Thinking...\r");
        await chatting();
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
    }
}
main();