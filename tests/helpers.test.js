const helpers = require('../utils/helpers.util.js');

test('shortenToTwentyChar() - Input has 0 characters', () => {
    // Test Data
    const td = {
        testName: '',
        expectedResult: ''
    }
    expect(helpers.shortenToTwentyChar(td.testName)).toEqual(td.expectedResult);
});

test('shortenToTwentyChar() - Input has less than 20 characters', () => {
    // Test Data
    const td = {
        nineteenChar: '123456789_123456789',
        expectedResult: '123456789_123456789'
    }
    expect(helpers.shortenToTwentyChar(td.nineteenChar)).toEqual(td.expectedResult);
});

test('shortenToTwentyChar() - Input is equal to 20 characters', () => {
    // Test Data
    const td = {
        twentyChar: '123456789_123456789_',
        expectedResult: '123456789_123456789_'
    }
    expect(helpers.shortenToTwentyChar(td.twentyChar)).toEqual(td.expectedResult);
});

test('shortenToTwentyChar() - Input is more than to 20 characters', () => {
    // Test Data
    const td = {
        thirtyChar: '123456789_123456789_123456789_',
        expectedResult: '123456789_1234567...' // Ends in ellipsis
    }
    expect(helpers.shortenToTwentyChar(td.thirtyChar)).toEqual(td.expectedResult);
});