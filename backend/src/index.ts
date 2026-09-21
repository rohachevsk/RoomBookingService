import app from './app';
import { env } from './config/env';
import { purgeOldLogs, scheduleLogRetention } from './lib/logRetention';

const bootstrap = () => {
    purgeOldLogs()
        .then((deleted) => {
            if (deleted > 0) {
                console.log(`Log retention: purged ${deleted} old log record(s)`);
            }
        })
        .catch((error) => {
            console.error('Log retention purge failed:', error);
        });
    scheduleLogRetention();
    app.listen(env.port, () => {
        console.log(`API server running on http://localhost:${env.port}`);
    });
};

bootstrap();