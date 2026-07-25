jest.mock('../models/index');
jest.mock('pdfkit');

const { mockRes, mockReq } = require('./testUtils');
const notesController = require('../controllers/notesController');

describe('POST /notes - missing title (EXPECTED TO FAIL)', () => {
  test('WRONG: assumes the API accepts a note with no title (actual behavior is 400)', async () => {
    const req = mockReq({ user: { id: 1 }, body: { content: 'no title here' } });
    const res = mockRes();

    await notesController.createNote(req, res);

    // The real controller rejects a missing title with 400 + an error message.
    // This test wrongly expects success (201), so it fails on purpose.
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
