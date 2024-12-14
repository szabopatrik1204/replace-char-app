// test/app.test.js
const { replaceCharAtMods } = require('../src/calculate');
const http = require('http');
const { createServer } = require('../src/index');

describe('replaceCharAtMods function', () => {
  test('happy path', () => {
    expect(replaceCharAtMods('replaceChars', 2)).toBe('re2l2c2C2a2s');
  });
  
  test('happy path with float number', () => {
    expect(replaceCharAtMods('replaceChars', 2.8)).toBe('re2l2c2C2a2s');
  });

  test('should throw an error if non-numeric value is passed', () => {
    expect(() => replaceCharAtMods('string', 'not a number')).toThrow('The second argument must be a number.');
  });

  test('should throw an error if not less than 10', () => {
    expect(() => replaceCharAtMods('string', 10)).toThrow('The second argument must be less than 10.');
  });

  test('should throw an error if less than 3 characters', () => {
    expect(() => replaceCharAtMods('a', 3)).toThrow('The first argument must be more than 3 characters long.');
  });
});

describe('HTTP Server', () => {
  let server;
  const PORT = 3000;

  beforeAll((done) => {
    server = createServer();
    server.listen(PORT, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  function makeRequest(path) {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${PORT}${path}`, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, data });
        });
      }).on('error', reject);
    });
  }

  test('should return correct sum for valid numbers', async () => {
    const response = await makeRequest('/calculate?str=aaaaa&num=3');
    expect(response.statusCode).toBe(200);
    expect(response.data).toBe('Replacing characters in aaaaa by 3 is aaa3a');
  });

  test('should handle negative numbers', async () => {
    const response = await makeRequest('/calculate?str=aaaaa&num=-3');
    expect(response.statusCode).toBe(200);
    expect(response.data).toBe('Replacing characters in aaaaa by -3 is aaa3a');
  });

  test('should handle floating-point numbers', async () => {
    const response = await makeRequest('/calculate?str=aaaaa&num=3.2');
    expect(response.statusCode).toBe(200);
    expect(response.data).toBe('Replacing characters in aaaaa by 3.2 is aaa3a');
  });

  test('should return 400 for missing parameters', async () => {
    const response = await makeRequest('/calculate?str=5');
    expect(response.statusCode).toBe(400);
    expect(response.data).toBe('Please provide a valid string and a number as query parameter: str, num');
  });

  test('should return 400 for invalid numbers', async () => {
    const response = await makeRequest('/calculate?str=aaaaa&num=abc');
    expect(response.statusCode).toBe(400);
    expect(response.data).toBe('The second argument must be a valid number.');
  });

  test('should return 404 for invalid path', async () => {
    const response = await makeRequest('/invalid');
    expect(response.statusCode).toBe(404);
    expect(response.data).toBe('Not Found');
  });
});