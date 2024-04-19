const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const CRLF = "\r\n\r\n";

function parseData(dataBuf) {
    const data = dataBuf.toString().split("\r\n");
    const [method, path, version] = data[0].split(' ');
    return {
        path, method, version
    };
};

function routeRequest(path) {
    if (path == '/') {
        return `HTTP/1.1 200 OK ${CRLF}`;
    }
    if (path.startsWith('/echo/')) {
        const s = path.substring(6); // string after `/echo/`
        return `HTTP/1.1 200 OK\r 
        Content-Type: text/plain\r
        Content-Length: ${s.length}\r
        \r
        ${s}\r`
    };
    return `HTTP/1.1 404 Not Found ${CRLF}`;
};

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const parsedData = parseData(data);
    socket.write(routeRequest(paredData.path));
  });
  socket.on("close", () => {
    socket.end();
    server.close();
  });
});
//
server.listen(4221, "localhost");
