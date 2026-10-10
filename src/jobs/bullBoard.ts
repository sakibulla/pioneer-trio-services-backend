import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue, documentQueue, cleanupQueue } from './queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullAdapter(emailQueue), new BullAdapter(documentQueue), new BullAdapter(cleanupQueue)],
  serverAdapter,
});

export const bullBoardRouter = serverAdapter.getRouter();
