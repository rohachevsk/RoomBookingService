import app from './app';
import { env } from './config/env';

const bootstrap = () => {
    app.listen(env.port, () => {
        console.log(`API server running on http://localhost:${env.port}`);
    });
};

bootstrap();