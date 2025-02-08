"use client";

import { useState, useEffect } from "react";

const statuses = ["Pending", "Processing", "Shipped", "Delivered"];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  return (
    <div className="p-4 grid grid-cols-4 gap-4">
      {statuses.map((status) => (
        <div key={status} className="bg-gray-100 p-4 rounded-lg min-h-[400px]">
          <h3 className="text-md font-bold">{status}</h3>
          <div className="mt-2 space-y-2">
            {tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <div key={task.id} className="p-2 bg-white shadow rounded-md">
                  {task.title}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
