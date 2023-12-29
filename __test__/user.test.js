jest.mock('../models/User'); // Assuming your User model is in '../models/User'
jest.mock('../utils/emailService'); // Mock your email service

const { registerUser } = require('../controllers/authController');
const User = require('../models/User');
const { sendVerificationCode } = require('../utils/emailService');

describe('registerUser function', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mock usage between tests
  });

  it('should return an error if required fields are missing', async () => {
    const req = { body: {} };
    const next = jest.fn();
    await registerUser(req, {}, next);
    expect(next).toHaveBeenCalledWith(new ErrorHandler('Please enter all fields', 400));
  });

  // Add more test cases for different scenarios
  it('should successfully register a user and send a verification code', async () => {
    // Mock existing users to return null (not found)
    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    // Mock the User.create method to return a new user
    const createdUser = { /* mock user object */ };
    User.create.mockResolvedValueOnce(createdUser);

    // Mock the generateCode function
    const { generateCode } = require('../utils/codeGenerator');
    jest.mock('../utils/codeGenerator', () => ({
      generateCode: jest.fn(() => 'mocked_verification_code'),
    }));

    const req = {
      body: {
        // Provide required fields and other necessary data for a valid user registration
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await registerUser(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(/* Expected user data */);
    expect(sendVerificationCode).toHaveBeenCalledWith(/* Expected email and code */);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Account Verification Code sent successfully',
    });
  });

  // Add more test cases for edge cases, validation checks, error handling, etc.
});