import cors from 'cors';
import express, { Application, Request, Response } from 'express';

import apiRoutes from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
    });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
