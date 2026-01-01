import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chatbot Button */}
      <motion.button
        onClick={toggleChat}
        className="chatbot-button"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #023e8a 0%, #0077B6 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(54, 129, 182, 0.4)",
          zIndex: 1000,
          transition: "all 0.3s ease",
        }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: "0 6px 30px rgba(0, 119, 182, 0.6)",
        }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.5 
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <X className="w-6 h-6" style={{ color: "#fff" }} />
            </motion.div>
          ) : (
            <motion.div
              key="message"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MessageCircle className="w-6 h-6" style={{ color: "#fff" }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              bottom: "6rem",
              right: "2rem",
              width: "380px",
              height: "500px",
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(0, 119, 182, 0.2)",
              zIndex: 999,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #023e8a 0%, #0077B6 100%)",
                padding: "1.25rem",
                borderRadius: "16px 16px 0 0",
              }}
            >
              <h3 style={{ color: "#fff", fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
                AutoInsight Assistant
              </h3>
              <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.875rem", margin: "0.25rem 0 0 0" }}>
                How can I help you today?
              </p>
            </div>

            {/* Chat Content */}
            <div
              style={{
                flex: 1,
                padding: "1.25rem",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Welcome Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: "rgba(54, 129, 247, 0.1)",
                  padding: "0.875rem",
                  borderRadius: "12px",
                  maxWidth: "85%",
                }}
              >
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#0b0c10", lineHeight: 1.5 }}>
                  Welcome! I'm here to help you with vehicle market insights and analytics. 
                  Ask me about pricing trends, market analysis, or how to use AutoInsight features.
                </p>
              </motion.div>

              {/* Quick Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <button
                  onClick={() => alert("This would navigate to pricing trends")}
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(0, 119, 182, 0.3)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.875rem",
                    color: "#0b0c10",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 119, 182, 0.05)";
                    e.currentTarget.style.borderColor = "#0077B6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "rgba(0, 119, 182, 0.3)";
                  }}
                >
                  📊 Show me pricing trends
                </button>
                <button
                  onClick={() => alert("This would show popular models")}
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(0, 119, 182, 0.3)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.875rem",
                    color: "#0b0c10",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 119, 182, 0.05)";
                    e.currentTarget.style.borderColor = "#0077B6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "rgba(0, 119, 182, 0.3)";
                  }}
                >
                  🚗 What are the most popular models?
                </button>
                <button
                  onClick={() => alert("This would explain features")}
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(0, 119, 182, 0.3)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.875rem",
                    color: "#0b0c10",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 119, 182, 0.05)";
                    e.currentTarget.style.borderColor = "#0077B6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "rgba(0, 119, 182, 0.3)";
                  }}
                >
                  ℹ️ How does AutoInsight work?
                </button>
              </motion.div>
            </div>

            {/* Input Area */}
            <div
              style={{
                padding: "1rem",
                borderTop: "1px solid rgba(54, 129, 247, 0.1)",
                background: "rgba(246, 248, 250, 0.8)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                }}
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(0, 119, 182, 0.2)",
                    fontSize: "0.875rem",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0077B6";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0, 119, 182, 0.2)";
                  }}
                />
                <button
                  style={{
                    background: "linear-gradient(135deg, #023e8a 0%, #0077B6 100%)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.75rem 1.25rem",
                    color: "#fff",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
