import { cronJobs } from '../../scripts/cron';

console.log('Starting cron runner...');
cronJobs.startScheduler();