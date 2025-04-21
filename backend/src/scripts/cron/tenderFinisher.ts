import cron from 'node-cron';

export function startScheduler() {
    console.log('Starting scheduler...');

    // Schedule a task to run every minute
    cron.schedule('* * * * *', () => {
        console.log('Running scheduled task at:', new Date().toISOString());
    });

    // Keep the process running
    process.stdin.resume();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('Stopping scheduler...');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('Stopping scheduler...');
        process.exit(0);
    });
} 