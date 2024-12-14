// src/calculate.js

/**
 * Adds two numbers together.
 * @param {string} a - The base of the password.
 * @param {number} b - A number.
 * @returns {string} - The result of the calculation.
 */
function replaceCharAtMods(a, b) {
    if (typeof b !== 'number') {
        throw new Error('The second argument must be a number.');
    }

    if (b >= 10) {
        throw new Error('The second argument must be less than 10.');
    }
    
    if (a.length < 4) {
        throw new Error('The first argument must be more than 3 characters long.');
    }

    b = Math.floor(Math.abs(b));

    const divided = Math.floor(a.length / b)
    let res = a.toString();
    let resArray;
    
    for (let i = 1; i <= divided; i++) {
        if ((b * i) < res.length) {
            resArray = res.split("");
            resArray[b * i] = b;
            res = resArray.join("");
        }
    }

    return res;
  }

  module.exports = { replaceCharAtMods };
  