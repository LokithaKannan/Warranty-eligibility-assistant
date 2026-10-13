import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { authRouter } from './routes/auth.routes';
import { policyRouter } from './routes/policy.routes';
import { claimRouter } from './routes/claim.routes';
import { adminRouter } from './routes/admin.routes';
import { dashboardStats } from './controllers/claim.controller';
import { authenticate } from './middleware/auth.middleware';

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disabled for Swagger UI
  })
);

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// Compression
app.use(compression());

// Request ID
app.use(requestIdMiddleware);

// Logging (skip in test)
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: '1.0.0',
    },
  });
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticate, dashboardStats);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/policies', policyRouter);
app.use('/api/claims', claimRouter);
app.use('/api/admin', adminRouter);

// Swagger / OpenAPI
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Product Warranty & Claim Eligibility Assistant API',
      version: '1.0.0',
      description:
        'REST API for the Warranty Eligibility Assistant. ' +
        'This application provides a preliminary warranty eligibility check for informational purposes only. ' +
        'It does not guarantee claim approval. Final eligibility must be confirmed by the manufacturer or authorized service provider.',
      contact: { name: 'Wipro CPPE Project' },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    servers: [
      { url: `http://localhost:${env.PORT}`, description: 'Local development server' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Warranty Assistant API Docs',
  })
);

// 404 handler
app.use(notFoundMiddleware);

// Error handler
app.use(errorMiddleware);

export { app };
