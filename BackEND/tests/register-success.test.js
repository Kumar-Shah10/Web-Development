process.env.JWT_SECRET = 'test-secret';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

jest.mock('../models/index');
jest.mock('../utils/mailer', () => ({ sendResetEmail: jest.fn().mockResolvedValue(undefined) }));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const { mockRes, mockReq } = require('./testUtils');
const { User } = require('../models/index');
const authController = require('../controllers/authController');

describe('POST /register - success', () => {
  test('creates a new user and returns 201 with a token', async () => {
    User.findByEmail.mockResolvedValue(undefined);
    User.create.mockResolvedValue({
      id: 42,
      email: 'new@example.com',
      username: 'new',
      theme: 'light',
    });

    const req = mockReq({ body: { email: 'new@example.com', password: 'secret123' } });
    const res = mockRes();

    await authController.register(req, res);

    expect(User.create).toHaveBeenCalledWith('new@example.com', 'hashed-password', 'new');
    expect(res.status).toHaveBeenCalledWith(201);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.message).toBe('User registered successfully');
    expect(jsonArg.user).toEqual({ id: 42, email: 'new@example.com', username: 'new', theme: 'light' });
    expect(typeof jsonArg.token).toBe('string');
  });
});
