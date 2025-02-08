"use client";

import { useState, useEffect } from "react";

export default function ChatHub() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetch("/api/messages")
      .then((res) => res.json())
      .then((data) => setMessages(data));
  }, []);

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg w-full h-[500px] overflow-y-auto">
      <h2 className="text-lg font-bold mb-2">ChatHub</h2>
      <div className="space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="p-2 bg-gray-100 rounded-md">
            <p className="text-sm font-semibold">{msg.fromNumber}</p>
            <p className="text-sm">{msg.messageBody}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
