process.env.JWT_SECRET = 'test-secret';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

jest.mock('../models/index');
jest.mock('../utils/mailer', () => ({ sendResetEmail: jest.fn().mockResolvedValue(undefined) }));

const { mockRes, mockReq } = require('./testUtils');
const authController = require('../controllers/authController');

describe('PUT /change-password - too short (EXPECTED TO FAIL)', () => {
  test('WRONG: expects a different error message than the controller actually sends', async () => {
    const req = mockReq({
      user: { id: 1 },
      body: { currentPassword: 'oldpass', newPassword: 'short' },
    });
    const res = mockRes();

    await authController.changePassword(req, res);

    // Actual message is 'New password must be at least 8 characters'.
    // This assertion uses the wrong wording on purpose, so it fails.
    expect(res.json).toHaveBeenCalledWith({ error: 'Password too short' });
  });
});
