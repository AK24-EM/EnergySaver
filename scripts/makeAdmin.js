import mongoose from 'mongoose';
import User from '../server/models/User.js';
import 'dotenv/config';

const promoteToAdmin = async () => {
  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email address: node scripts/makeAdmin.js <email>');
    process.exit(1);
  }

  try {
    await mongoose.connect('mongodb://localhost:27017/energysaver');
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found!');
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();
    console.log(`Successfully promoted ${user.name} (${user.email}) to Admin.`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

promoteToAdmin();
