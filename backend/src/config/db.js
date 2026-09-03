const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placeonix');
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    // Ensure default system Admin account exists without touching any existing users
    const adminExists = await User.findOne({ email: 'admin@placeonix.edu' });
    if (!adminExists) {
      await User.create({
        name: 'System Administrator',
        email: 'admin@placeonix.edu',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      });
      console.log('👑 System Admin account initialized (admin@placeonix.edu / admin123).');
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`💡 Tip: Ensure your MongoDB server is running (mongod) or update MONGODB_URI in backend/.env`);
    process.exit(1);
  }
};

module.exports = connectDB;
