import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { authRoutes } from './auth/auth.routes';
import { immigrationRoutes } from './immigration/immigration.routes';
import { matrimonialRoutes } from './matrimonial/matrimonial.routes';
import { matchmakerRoutes } from './matchmaker/matchmaker.routes';
import { coordinatorRoutes } from './coordinator/coordinator.routes';
import { adminRoutes } from './admin/admin.routes';
import { contactRoutes } from './contact/contact.routes';
import { healthRoutes } from './health/health.routes';
import { metricsRoutes } from './metrics/metrics.routes';
import { swaggerSpec } from '../../docs/swagger';

const v1Router = Router();

// Interactive OpenAPI / Swagger Documentation
v1Router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Pioneer Trio API Docs',
}));

// Route Modules
v1Router.use('/auth', authRoutes);
v1Router.use('/immigration', immigrationRoutes);
v1Router.use('/matrimonial', matrimonialRoutes);
v1Router.use('/matchmaker', matchmakerRoutes);
v1Router.use('/coordinator', coordinatorRoutes);
v1Router.use('/admin', adminRoutes);
v1Router.use('/contact', contactRoutes);
v1Router.use('/health', healthRoutes);
v1Router.use('/metrics', metricsRoutes);

export { v1Router };
