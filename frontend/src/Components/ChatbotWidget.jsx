import { useState } from "react";
import { chatWithAi } from "../services/api";
import "./ChatbotWidget.css";

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! Ask me about pens, notebooks, or gift ideas." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatWithAi(trimmed);
      const reply = response.reply || response.message || "Thanks!";
      const sourceNames = Array.isArray(response.items)
        ? response.items.slice(0, 3).map((item) => item.name).filter(Boolean)
        : [];

      const sourceText = sourceNames.length
        ? `\n\nBased on: ${sourceNames.join(", ")}`
        : "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `${reply}${sourceText}` },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I could not reach the assistant." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`chatbot ${open ? "open" : ""}`}>
      <button className="chatbot-toggle" onClick={() => setOpen(!open)}>
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">AI Assistant</div>
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chatbot-message ${message.role}`}
              >
                {message.text}
              </div>
            ))}
            {loading && (
              <div className="chatbot-message assistant">Typing...</div>
            )}
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Ask about stationery..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSend();
              }}
            />
            <button onClick={handleSend} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
