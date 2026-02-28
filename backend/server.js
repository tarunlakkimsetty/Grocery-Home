const config = require('./config/config');
const app = require('./app');
const { testConnection } = require('./config/db');

// Start server after testing database connection
const startServer = async () => {
    // Test database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
        console.error('Failed to connect to database. Server not started.');
        process.exit(1);
    }

    // Start Express server
    app.listen(config.port, () => {
        console.log(`Server running in ${config.env} mode on port ${config.port}`);
    });
};

startServer();
