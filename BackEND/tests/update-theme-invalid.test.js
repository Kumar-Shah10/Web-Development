process.env.JWT_SECRET = 'test-secret';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

jest.mock('../models/index');
jest.mock('../utils/mailer', () => ({ sendResetEmail: jest.fn().mockResolvedValue(undefined) }));

const { mockRes, mockReq } = require('./testUtils');
const { User } = require('../models/index');
const authController = require('../controllers/authController');

describe('PUT /theme - invalid value', () => {
  test('returns 400 when theme is not "light" or "dark"', async () => {
    const req = mockReq({ user: { id: 1 }, body: { theme: 'neon' } });
    const res = mockRes();

    await authController.updateTheme(req, res);

    expect(User.updateTheme).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid theme' });
  });
});
