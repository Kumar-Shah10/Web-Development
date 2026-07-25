process.env.JWT_SECRET = 'test-secret';

const { mockRes, mockReq } = require('./testUtils');
const authenticateToken = require('../middleware/auth');

describe('authenticateToken middleware - no token', () => {
  test('returns 401 when no Authorization header is present', () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
  });
});
