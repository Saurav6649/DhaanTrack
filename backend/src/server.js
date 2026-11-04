import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { bootstrapAdmin } from './services/authService.js';

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Ensure Admin and default configs exist
    await bootstrapAdmin();

    app.listen(ENV.PORT, () => {
      console.log(`=================================================`);
      console.log(`🌾 DhaanTrack API Server running on port ${ENV.PORT}`);
      console.log(`🌾 Environment: ${ENV.NODE_ENV}`);
      console.log(`🌾 Database: ${ENV.MONGODB_URI}`);
      console.log(`🌾 Frontend Allowed Origin: ${ENV.FRONTEND_URL}`);
      console.log(`=================================================`);
    });
  } catch (err) {
    console.error('Fatal Server Error:', err.message);
    process.exit(1);
  }
};

startServer();
