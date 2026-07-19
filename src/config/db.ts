import mongoose from 'mongoose';

const connectDb = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error('MONGODB_URI is not configured');
    }

    await mongoose.connect(mongoUri);

    return mongoose.connection;
};

export default connectDb;