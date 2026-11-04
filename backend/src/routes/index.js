import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import machineRoutes from './machineRoutes.js';
import contractorRoutes from './contractorRoutes.js';
import workSessionRoutes from './workSessionRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import reportRoutes from './reportRoutes.js';
import masterDataRoutes from './masterDataRoutes.js';
import recycleBinRoutes from './recycleBinRoutes.js';
import customerRoutes from './customerRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/machines', machineRoutes);
apiRouter.use('/contractors', contractorRoutes);
apiRouter.use('/work-sessions', workSessionRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/master-data', masterDataRoutes);
apiRouter.use('/recycle-bin', recycleBinRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/notifications', notificationRoutes);

export default apiRouter;
