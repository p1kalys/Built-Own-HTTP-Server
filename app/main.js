const net = require("net");

const CRLF = "\r\n\r\n";
const NOT_FOUND = `HTTP/1.1 404 Not Found${CRLF}`;

const server = net.createServer((socket) => {
  socket.on("close", () => {
    console.log("[Socket] closed");
    socket.end();
    server.close();
  });

  socket.on("data", (data) => {
    queueMicrotask(() => {
      const parsedData = parseData(data);
      console.log("[Socket] data received", parsedData);
      socket.write(routeRequest(parsedData));
      socket.end();
    });
  });
});

function plainTextResponse(data) {
  return `HTTP/1.1 200 OK\r
Content-Type: text/plain\r
Content-Length: ${data.length}\r
\r
${data}\r
`;
}

function routeRequest(req) {
  const path = req.path;
  if (path === "/") {
    return `HTTP/1.1 200 OK${CRLF}`;
  }

  if (path === "/user-agent") {
    const data = req.headers["User-Agent"];
    if (data) {
      return plainTextResponse(data);
    }
    return NOT_FOUND;
  }

  if (path.startsWith("/echo/")) {
    const str = path.substring(6); // starting index after `/echo/`
    return plainTextResponse(str);
  }

  return NOT_FOUND;
}

function parseData(dataBuf) {
  const data = dataBuf.toString();
  const [first, ...rest] = data.split("\r\n");
  const [method, path, version] = first.split(" ");

  const headers = {};
  for (const line of rest) {
    const seperator = line.indexOf(": ");
    if (seperator === -1) {
      continue;
    }
    const key = line.substring(0, seperator);
    const value = line.substring(key.length + 2);
    headers[key] = value;
  }

  return {
    path,
    method,
    version,
    headers,
  };
}

server.listen(4221, "localhost");
