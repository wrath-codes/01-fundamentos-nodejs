import http from "node:http";

import { taskRoutes } from "../challenge/tasks.js";
import { json } from "./middelewares/json.js";
import { extractQueryParams } from "./utils/extract-query-params.js";

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  await json(req, res);

  const route = taskRoutes.find((route) => {
    return route.method === method && route.path.test(url);
  });

  console.log(route);

  if(route) {
    const routeParams = req.url.match(route.path);

    // console.log(extractQueryParams(routeParams.groups.query))

    const { query, ...params } = routeParams.groups;

    req.params = params;
    req.query = query ? extractQueryParams(query) : {};

    return route.handler(req, res);
  }

  return res.writeHead(404).end();
});

const port = 6969;

server.listen(port, () => {
  console.log(`Server is running on port ${ port }`);
});
