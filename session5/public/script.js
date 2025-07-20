const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage("user", userMessage);
  input.value = "";

  // setTimeout(() => {
  //   appendMessage("bot", "Gemini is thingking...");
  // }, 1000);

  // Send user message to backend
  try {
    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("HTTP error " + response.status);
        return response.json();
      })
      .then((data) => {
        appendMessage("bot", data.reply);
      })
      .catch((error) => {
        appendMessage("bot", "Sorry, there was an error.");
        console.error("Error:", error);
      });
  } catch (error) {
    appendMessage("bot", "Sorry, there was an error.");
    console.error("Error:", error);
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
