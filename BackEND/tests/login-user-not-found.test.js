process.env.JWT_SECRET = 'test-secret';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

jest.mock('../models/index');
jest.mock('../utils/mailer', () => ({ sendResetEmail: jest.fn().mockResolvedValue(undefined) }));

const { mockRes, mockReq } = require('./testUtils');
const { User } = require('../models/index');
const authController = require('../controllers/authController');

describe('POST /login - unknown user', () => {
  test('returns 401 with a generic "Invalid credentials" message', async () => {
    User.findByEmail.mockResolvedValue(undefined);

    const req = mockReq({ body: { email: 'ghost@example.com', password: 'whatever' } });
    const res = mockRes();

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });
});
