import { parse } from "csv-parse";
import { randomUUID } from "node:crypto";
import fs from "node:fs";

import { Database } from "../src/database.js";
import { buildRoutePath } from "../src/utils/build-route-path.js";


const database = new Database();

export const taskRoutes = [

  // Get all Tasks
  {
    method: "GET",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const { search } = req.query;

      const searchTasksData = search ? {
        title: search,
        description: search,
      } : null;

      const tasks = database.select("tasks", searchTasksData);

      return res.end(JSON.stringify(tasks));
    },
  },

  // Create a Task
  {
    method: "POST",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const { title, description } = req.body;

      if(!title || !description) {
        return res.writeHead(400).end(JSON.stringify("Missing title or description"));
      }


      const task = {
        id: randomUUID(),
        title,
        description,
        completed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      database.insert("tasks", task);
      return res.writeHead(201).end(JSON.stringify("Task created"));
    },
  },

  // Update a Task
  {
    method: "PUT",
    path: buildRoutePath("/tasks/:id"),
    handler: (req, res) => {
      const { id } = req.params;
      const { title, description } = req.body;

      if(database.select("tasks", { id }).length === 0) {
        return res.writeHead(404).end(JSON.stringify("Task not found"));
      }

      if(!title || !description) {
        return res.writeHead(400).end(JSON.stringify("Missing title or description"));
      }

      database.update("tasks", id, { title, description });
      return res.writeHead(204).end(JSON.stringify("Task updated"));
    },
  },

  // Delete a Task
  {
    method: "DELETE",
    path: buildRoutePath("/tasks/:id"),
    handler: (req, res) => {
      const { id } = req.params;

      if(database.select("tasks", { id }).length === 0) {
        return res.writeHead(404).end(JSON.stringify("Task not found"));
      }

      database.delete("tasks", id);
      return res.writeHead(204).end(JSON.stringify("Task deleted"));
    }
  },

  // Complete a Task
  {
    method: "PATCH",
    path: buildRoutePath("/tasks/:id/complete"),
    handler: (req, res) => {
      const { id } = req.params;

      if(database.select("tasks", { id }).length === 0) {
        return res.writeHead(404).end(JSON.stringify("Task not found"));
      }

      if(database.select("tasks", { id })[0].completed_at) {
        database.update("tasks", id, { completed_at: null });
        return res.writeHead(204).end(JSON.stringify("Task uncompleted"));
      }

      database.update("tasks", id, { completed_at: new Date() });
      return res.writeHead(204).end(JSON.stringify("Task completed"));
    }
  },

  // Import Tasks
  {
    method: "POST",
    path: buildRoutePath("/tasks/import"),
    handler: (req, res) => {

      const csvPath = new URL('./tasks.csv', import.meta.url);
      const stream = fs.createReadStream(csvPath);
      const csvParse = parse({
        delimiter: ",",
        skipEmptyLines: true,
        fromLine: 2,
      })

      const lineParse = stream.pipe(csvParse);

      lineParse.on("data", (line) => {
        const [title, description] = line;

        const task = {
          id: randomUUID(),
          title,
          description,
          completed_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        database.insert("tasks", task);
      });

      lineParse.on("end", () => {
        return res.writeHead(201).end(JSON.stringify("Tasks imported"));
      });
    }
  },
]