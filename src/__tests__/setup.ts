import { setupVSCodeMock } from './test-utils';

// Configure Jest
jest.setTimeout(10000); // 10 second timeout

// Mock fs module
jest.mock('fs', () => ({
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
    unlinkSync: jest.fn()
}));

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

// Mock console methods to prevent noise in test output
global.console = {
    ...console,
    // Keep error logging for debugging
    error: jest.fn(),
    // Silence log and debug in tests
    log: jest.fn(),
    debug: jest.fn(),
    // Keep warnings but make them mockable
    warn: jest.fn()
};

// Set up VS Code mocks
setupVSCodeMock();

// Add a dummy test to satisfy Jest's requirement
describe('Test Setup', () => {
    it('should have VS Code mocks configured', () => {
        const mockVSCode = jest.requireMock('vscode');
        expect(jest.isMockFunction(mockVSCode.window.showInputBox)).toBe(true);
        expect(jest.isMockFunction(mockVSCode.window.showQuickPick)).toBe(true);
        expect(jest.isMockFunction(mockVSCode.window.showInformationMessage)).toBe(true);
        expect(jest.isMockFunction(mockVSCode.window.showErrorMessage)).toBe(true);
    });
}); 