process.env.JWT_SECRET = 'test-secret';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

jest.mock('../models/index');
jest.mock('../utils/mailer', () => ({ sendResetEmail: jest.fn().mockResolvedValue(undefined) }));

const { mockRes, mockReq } = require('./testUtils');
const authController = require('../controllers/authController');

describe('POST /register - missing fields', () => {
  test('returns 400 when email or password is missing', async () => {
    const req = mockReq({ body: { email: '', password: '' } });
    const res = mockRes();

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
  });
});
