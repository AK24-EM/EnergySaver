
import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
console.log('Testing connection to:', uri?.replace(/:([^:@]+)@/, ':****@'));

if (!uri) {
    console.error('MONGO_URI is undefined in .env');
    process.exit(1);
}

mongoose.connect(uri)
    .then(() => {
        console.log('Successfully connected to MongoDB Atlas!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Connection failed:', err);
        process.exit(1);
    });
