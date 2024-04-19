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
}

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const parsedData = parseData(data);
    socket.write(parsedData.path === '/' ? `HTTP/1.1 200 OK ${CRLF}` : `HTTP/1.1 404 Not Found ${CRLF}`);
  });
  socket.on("close", () => {
    socket.end();
    server.close();
  });
});
//
server.listen(4221, "localhost");
