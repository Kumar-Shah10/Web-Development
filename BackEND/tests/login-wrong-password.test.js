process.env.JWT_SECRET = 'test-secret';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

jest.mock('../models/index');
jest.mock('../utils/mailer', () => ({ sendResetEmail: jest.fn().mockResolvedValue(undefined) }));
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(false),
}));

const { mockRes, mockReq } = require('./testUtils');
const { User } = require('../models/index');
const authController = require('../controllers/authController');

describe('POST /login - wrong password', () => {
  test('returns 401 when the password does not match', async () => {
    User.findByEmail.mockResolvedValue({ id: 1, email: 'user@example.com', password: 'hashed' });

    const req = mockReq({ body: { email: 'user@example.com', password: 'wrong-pass' } });
    const res = mockRes();

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });
});
