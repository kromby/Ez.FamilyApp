import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { familiesRouter } from './routes/families';
import { usersRouter } from './routes/users';
import { channelsRouter } from './routes/channels';
import { messagesRouter } from './routes/messages';
import { signalrRouter } from './routes/signalr';
import { locationsRouter } from './routes/locations';
import { getPool } from './db/connection';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/families', familiesRouter);
app.use('/users', usersRouter);
app.use('/channels', channelsRouter);
app.use('/messages', messagesRouter);
app.use('/signalr', signalrRouter);
app.use('/locations', locationsRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

getPool().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('Failed to connect to database', err);
  process.exit(1);
});

export { app };
