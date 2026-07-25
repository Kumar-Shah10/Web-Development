process.env.JWT_SECRET = 'test-secret';

const { mockRes, mockReq } = require('./testUtils');
const authenticateToken = require('../middleware/auth');

describe('authenticateToken middleware - invalid token', () => {
  test('returns 403 when the token is malformed/expired', () => {
    const req = mockReq({ headers: { authorization: 'Bearer not-a-real-token' } });
    const res = mockRes();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });
});
