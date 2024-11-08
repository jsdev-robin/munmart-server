import http from 'http';
import app from './app';
import mongoose from 'mongoose';
import connectDatabase from './src/configs/connectDatabase';
import EnvConfig from './src/configs/envConfig';

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Create server
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const server = http.createServer(app);

// Connect to MongoDB
connectDatabase(EnvConfig.DB)
  .then(() => {
    const port = parseInt(EnvConfig.PORT);
    if (isNaN(port)) {
      console.error('Invalid port number provided in environment variables.');
      process.exit(1);
    }

    server.listen(port, () => {
      console.log(
        `App is running on port ${EnvConfig.PORT} in ${EnvConfig.NODE_ENV} mode.`
      );
    });
  })
  .catch((error: mongoose.Error) => {
    console.error('Database connection error:', error.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});
