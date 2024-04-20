const net = require("net");

const fs = require("fs");
const path = require('path');

const CRLF = "\r\n\r\n";
const NOT_FOUND = `HTTP/1.1 404 Not Found${CRLF}`;

const DIR = process.argv.length === 4 && process.argv[2] === '--directory' ? process.argv[3] : null;

const OK = (statusCode = 200) => {
  return `HTTP/1.1 ${statusCode} OK${CRLF}`;
};

const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
    server.close();
  });

  socket.on("data", (data) => {
    queueMicrotask(() => {
      const parsedData = parseData(data);
      socket.write(routeRequest(parsedData));
      socket.end();
    });
  });
});

function plainTextResponse(data, type = 'text/plain') {
  return `HTTP/1.1 200 OK\r
Content-Type: ${type}\r
Content-Length: ${data.length}\r
\r
${data}${CRLF}`;
};

function routeRequest(req) {
  const path = req.path;
  if (path === "/") {
    return OK();
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
  
  if (DIR && path.indexOf('/files/') === 0) {
    const fileName = path.substring(7); // starts after `/files/`
    if (req.method.toLowerCase() === 'get') {
      return octetStreamResponse(fileName);
    }
    return createFileResponse(fileName, req.body);
  }

  return NOT_FOUND;
};

function octetStreamResponse(fileName) {
  if (!DIR) {
    return NOT_FOUND;
  }

  try {
    const fileContent = fs.readFileSync(path.join(DIR, fileName)).toString();
    return plainTextResponse(fileContent, 'application/octet-stream');
  } catch {
    return NOT_FOUND;
  }
}

function createFileResponse(fileName, content) {
  try {
    fs.writeFileSync(path.join(DIR, fileName), content);
    return OK(201);
  } catch (error) {
    return NOT_FOUND;
  }
}

function parseData(dataBuf) {
  const data = dataBuf.toString();
  const [first, ...rest] = data.split("\r\n");
  const [method, path, version] = first.split(" ");
  let body = '';
  const headers = {};

  while (true) {
    const line = rest.shift();
    const seperator = line.indexOf(": ");
    if (seperator === -1) {
      body = rest.shift();
      break;
    }

    const key = line.substring(0, seperator);
    const value = line.substring(key.length + 2);
    headers[key] = value;
  }

  return {
    path,
    method,
    body,
    version,
    headers,
  };
}

server.listen(4221, "localhost");
