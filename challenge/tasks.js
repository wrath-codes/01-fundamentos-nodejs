import { parse } from "csv-parse/.";

import { Database } from "../src/database";
import { buildRoutePath } from "../src/utils/build-route-path";



const database = new Database();

export const routes = [

  // Get all Tasks
  {
    method: "GET",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const { search } = req.query;
      const tasks = database.select("tasks", {
        title: search,
        description: search,
        completed_at: search,
        created_at: search,
        updated_at: search,
      });
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
        return res.writeHead(400).end("Missing title or description")
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
      return res.writeHead(201).end("Task created");
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
        return res.writeHead(404).end("Task not found");
      }

      if(!title || !description) {
        return res.writeHead(400).end("Missing title or description");
      }

      database.update("tasks", id, { title, description });
      return res.writeHead(204).end("Task updated");
    },
  },

  // Delete a Task
  {
    method: "DELETE",
    path: buildRoutePath("/tasks/:id"),
    handler: (req, res) => {
      const { id } = req.params;

      if(database.select("tasks", { id }).length === 0) {
        return res.writeHead(404).end("Task not found");
      }

      database.delete("tasks", id);
      return res.writeHead(204).end("Task deleted");
    }
  },

  // Complete a Task
  {
    method: "PATCH",
    path: buildRoutePath("/tasks/:id/complete"),
    handler: (req, res) => {
      const { id } = req.params;

      if(database.select("tasks", { id }).length === 0) {
        return res.writeHead(404).end("Task not found");
      }

      database.update("tasks", id, { completed_at: new Date() });
      return res.writeHead(204).end("Task completed");
    }
  },

  // Import Tasks
  {
    method: "POST",
    path: buildRoutePath("/tasks/import"),
    handler: (req, res) => {
      const tasks = req.file

      if(!tasks) {
        return res.writeHead(400).end("Missing tasks file");
      }

      const csvPath = new URL(tasks.path, import.meta.url);
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
        return res.writeHead(201).end("Tasks imported");
      });
    }
  },
]