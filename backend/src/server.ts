import app from './app';

const PORT = process.env.PORT || 5000;

let currentPort = Number(PORT);

function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`=======================================================`);
    console.log(` Paree E-Commerce Server is running on port ${port}      `);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}       `);
    console.log(` Local URL: http://localhost:${port}                    `);
    console.log(`=======================================================`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is in use, trying next port...`);
      server.close();
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer(currentPort);


