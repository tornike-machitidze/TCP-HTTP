const net = require('net');
const {writeFileSync, readFileSync} = require('node:fs')

const port = 80;
const host = '127.0.0.1';

const server = net.createServer((socket) => {
    console.log('New Connection!');

    socket.on('data', (data) => {
        const request = data.toString('utf-8');
        const lines = request.split('\r\n');
        const [method, url, protocol] = lines[0].split(' ');

        // Extract the headers and body
        const headers = {};
        let body = '';
        let isInBody = false;

        for (let i = 1; i < lines.length; i++) {
            if (lines[i] === '') {
                isInBody = true;
                continue;
            }

            if (!isInBody) {
                const [name, value] = lines[i].split(':');
                headers[name.toLowerCase()] = value.trim();
            } else {
                body += lines[i];
            }
        }

        const writeResponse = (statusCode, statusMsg, connction, contentType, body) => {
            const response = `HTTP/1.1 ${statusCode} ${statusMsg}\r\nConnection: ${connction}\r\nContent-Type: ${contentType}\r\nContent-Length: ${body.length}\r\n\r\n${body}`;
            return response;
        };

        if (method === 'GET' && url === '/') {
            console.log(`Request: ${method} \r\nPath: ${url}`);
            const responseBody = `<html>
            <head> <title>TCP-HTTP</title> </head>
            <body>
            <h1> Use Net module to Create HTTP Server </h1>
            <a href="http://localhost/account"> <h3>create an account</h3> </a>
            </body>
            </html>`;
            const response = writeResponse(200, 'OK', 'keep-alive', 'text/html', responseBody);

            socket.end(response);
        } else if (method === 'GET' && url === '/account') {
            console.log(`Request: ${method} \r\nPath: ${url}`);
            const responseBody = `<html>
            <h1>Register</h1>
            <form id="registerForm" method="POST" action="/register">
              <input type="text" name="name" placeholder="Enter your name">
              <input type="text" name="lastname" placeholder="Enter your lastname">
              <input type="submit">
            </form>

            <script>
              document.getElementById('registerForm').addEventListener('submit', function(event) {
                event.preventDefault(); // Prevent the default form submission behavior

                // Get the form data
                const formData = new FormData(event.target);

                // Create the request body
                const requestBody = {
                  name: formData.get('name'),
                  lastname: formData.get('lastname')
                };

                // Send the request
                fetch('/register', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(requestBody)
                })
                  .then(response => {
                    return response.json()
                  }).then(data => {
                    window.location.href = data.redirectUrl
                  })
                  .catch(error => {
                    // Handle the error
                    console.error('Error:', error);
                  });
              });
            </script>
          </html>`;
            const response = writeResponse(200, 'OK', 'keep-alive', 'text/html', responseBody);

            socket.end(response);
        } else if (method === 'POST' && url === '/register') {
            console.log(`Request: ${method} \r\nPath: ${url}`);
            const user = JSON.parse(body);
            const isCreated = createUser(body);

            let responseBody;
            if(!isCreated) {
                responseBody = JSON.stringify({ errorMsg: 'Can not create the user' })
            } else {
                responseBody = JSON.stringify({
                    user,
                    redirectUrl: 'http://localhost:80/profile'
                })
            }

            const response = writeResponse(210, 'Created', 'keep-alive', 'application/json', responseBody);
            socket.end(response);
        } else if(method === 'GET' && url === '/profile'){
            console.log(`Request: ${method} \r\nPath: ${url}`);
            const user = JSON.parse(readFileSync('./db/users.json').toString('utf-8'));

            const responseBody = `<html>
            <head> <title>Successfylly Registred </title> </head>
            <body>
                <h1> Successfylly Registred </h1>
                <h3> Name: ${user.name} </h3>
                <h3> Lastname: ${user.lastname} </h3>
            </body>
            </html>`;

            const response = writeResponse(200, 'OK', 'keep-alive', 'text/html', responseBody);
            socket.end(response);
        } else {
            console.log(`Request: ${method} \r\nPath: ${url}`);
            const responseBody = '<html><body><h1>Not Found</h1></body></html>';
            const response = writeResponse(404, 'Not Found', 'keep-alive', 'text/html', responseBody);

            socket.end(response);
        }
    });
});

function createUser (newUser) {
    const buff = Buffer.from(newUser)
    try {
        writeFileSync('./db/users.json', buff);
        return true;
    } catch (error) {
        console.log('Error while writeFileSync(user)', error);
        return false;
    }
}

server.listen(port, host, () => {
    console.log('Start litening... ', server.address());
});
