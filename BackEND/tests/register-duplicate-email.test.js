process.env.JWT_SECRET = 'test-secret';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

jest.mock('../models/index');
jest.mock('../utils/mailer', () => ({ sendResetEmail: jest.fn().mockResolvedValue(undefined) }));

const { mockRes, mockReq } = require('./testUtils');
const { User } = require('../models/index');
const authController = require('../controllers/authController');

describe('POST /register - duplicate email', () => {
  test('returns 400 when the email is already registered', async () => {
    User.findByEmail.mockResolvedValue({ id: 1, email: 'taken@example.com' });

    const req = mockReq({ body: { email: 'taken@example.com', password: 'secret123' } });
    const res = mockRes();

    await authController.register(req, res);

    expect(User.findByEmail).toHaveBeenCalledWith('taken@example.com');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
  });
});
