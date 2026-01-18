// src/__tests__/utils/logger.test.ts
// Tests for safe logger

// We'll test the sanitize function behavior through the logger
describe('logger', () => {
  let consoleSpy: {
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Import after mocking
  const getLogger = () => require('../../utils/logger').logger;

  describe('sanitization', () => {
    it('redacts email addresses in strings', () => {
      const logger = getLogger();
      logger.info('Test', 'User email', { message: 'Contact at user@example.com' });
      
      expect(consoleSpy.info).toHaveBeenCalled();
      const loggedArgs = consoleSpy.info.mock.calls[0];
      expect(JSON.stringify(loggedArgs)).toContain('[REDACTED]');
      expect(JSON.stringify(loggedArgs)).not.toContain('user@example.com');
    });

    it('redacts sensitive fields like text and notes', () => {
      const logger = getLogger();
      logger.info('Test', 'Entry data', { 
        id: '123',
        text: 'My private thoughts',
        notes: 'Session notes here',
        category: 'meaningful',
      });
      
      expect(consoleSpy.info).toHaveBeenCalled();
      const loggedArgs = consoleSpy.info.mock.calls[0];
      const logStr = JSON.stringify(loggedArgs);
      expect(logStr).toContain('"text":"[REDACTED]"');
      expect(logStr).toContain('"notes":"[REDACTED]"');
      expect(logStr).toContain('"id":"123"');
      expect(logStr).toContain('"category":"meaningful"');
    });

    it('truncates long strings', () => {
      const logger = getLogger();
      const longString = 'a'.repeat(150);
      logger.info('Test', 'Long content', { value: longString });
      
      expect(consoleSpy.info).toHaveBeenCalled();
      const loggedArgs = consoleSpy.info.mock.calls[0];
      const logStr = JSON.stringify(loggedArgs);
      expect(logStr).toContain('[TRUNCATED]');
      expect(logStr).not.toContain('a'.repeat(150));
    });

    it('limits array output', () => {
      const logger = getLogger();
      const longArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      logger.info('Test', 'Array data', { items: longArray });
      
      expect(consoleSpy.info).toHaveBeenCalled();
      const loggedArgs = consoleSpy.info.mock.calls[0];
      const logStr = JSON.stringify(loggedArgs);
      expect(logStr).toContain('more)');
    });
  });

  describe('log levels', () => {
    it('logs debug messages', () => {
      const logger = getLogger();
      logger.debug('TestTag', 'Debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith('[TestTag]', 'Debug message');
    });

    it('logs info messages', () => {
      const logger = getLogger();
      logger.info('TestTag', 'Info message');
      expect(consoleSpy.info).toHaveBeenCalledWith('[TestTag]', 'Info message');
    });

    it('logs warn messages', () => {
      const logger = getLogger();
      logger.warn('TestTag', 'Warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[TestTag]', 'Warning message');
    });

    it('logs error messages', () => {
      const logger = getLogger();
      logger.error('TestTag', 'Error message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[TestTag]', 'Error message');
    });
  });
});
