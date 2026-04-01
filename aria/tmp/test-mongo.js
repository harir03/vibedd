const mongoose = require('mongoose');
const uri = 'mongodb://localhost:27018/aria_db';

async function test() {
    try {
        console.log('Connecting to', uri);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected!');
        const count = await mongoose.connection.db.collection('alerts').countDocuments();
        console.log('Alert Documents Count:', count);
    } catch (err) {
        console.error('Failed to connect:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

test();
