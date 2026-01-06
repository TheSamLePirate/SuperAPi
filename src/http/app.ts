import express from 'express';
import cors from 'cors';
import routes from './routes';
import { config } from '../config';

const app = express();

app.use(cors());
app.use(express.json({ limit: config.MAX_HTTP_BUFFER_SIZE }));

// Monitor API requests
import { monitorRequestMiddleware } from './middleware';
app.use(monitorRequestMiddleware);

app.use('/', routes);

export default app;
