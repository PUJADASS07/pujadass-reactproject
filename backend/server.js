const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;
        if (!uri) {
            console.log('No MONGO_URI provided in .env, starting in-memory MongoDB...');
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
        }
        await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${uri}`);
        
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error('Database connection failed', error);
        process.exit(1);
    }
};

connectDB();
