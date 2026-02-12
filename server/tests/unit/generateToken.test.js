const jwt = require('jsonwebtoken');
const generateToken = require('../../utils/generateToken');

describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
        process.env.JWT_SECRET = 'testsecret';
        const id = 'user123';
        const role = 'user';
        const token = generateToken(id, role);
        
        const decoded = jwt.verify(token, 'testsecret');
        expect(decoded.id).toBe(id);
        expect(decoded.role).toBe(role);
    });
});
