const request = require('supertest');
const mongoose = require('mongoose');

// Mock connectDB to avoid real database connection during tests
jest.mock('../../config/db', () => jest.fn());

const app = require('../../app');

describe('GET /', () => {
    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('should return 200 and a welcome message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Welcome to StayWise API');
        expect(res.body).toHaveProperty('status', 'Running');
    });
});
