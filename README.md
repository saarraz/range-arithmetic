# range-arithmetic

[![NPM Downloads](https://img.shields.io/npm/dm/range-arithmetic.svg)](https://www.npmjs.org/package/range-arithmetic)
[![NPM Version](https://img.shields.io/npm/v/range-arithmetic.svg)](https://www.npmjs.org/package/range-arithmetic)

A javascript library for addition and subtraction of numeric ranges and sets of ranges.

## Getting Started
Install the module with: `npm install --save range-arithmetic`

## Examples
The library exports the Range class, which represents a not-necessarily contiguous range of numbers.

Import the library:
```
var Range = require('range-arithmetic');
```
ES6+:
```
import Range from 'range-arithmetic';
```

Initialize a Range object:
```
const r1 = new Range(3, 4); // OK - length 1 range including only 3 (Ranges are '[ )').
const r2 = new Range([2, 3], [4, 6]); // OK - includes 2, 4, 5
const r3 = new Range([[-3, 5], [8, 9]]); // OK - includes -3, -2, -1, 0, 1, 2, 3, 4, 8
const r4 = new Range(); // OK - empty range
const r5 = new Range(3.4, 4.21); // OK - floats are supported.
const r6 = new Range(Range.MIN, 10); // OK - includes all real numbers up to 10.
```

[tiny-range](https://www.npmjs.com/package/tiny-range) syntax is also supported for initialization, though initialization with it is inclusive on both ends.
```
const r7 = new Range('0, 1, 7~8, 9-10, 100~105'); // OK - includes 0, 1, 7, 8, 9, 10, 100, 101, 102, 103, 104, 105
```


Wrong ways to initialize:
```
new Range(9); // ERROR - supporting this would be inconsistent when using floats.
new Range(9.2); // ERROR - does this include 9.2 - 10.2? not supported.
new Range('a', 'b') // ERROR - numeric ranges only.
new Range(3, 2) // ERROR - start must come before end
new Range(3, 2, 9) // ERROR - what does this mean?
new Range([3, 5], [0, 2]) // ERROR - sub-ranges must be sorted.
new Range([3, 5], [2, 6]) // ERROR - sub-ranges must be non-overlapping.
```

Queries
```
console.log(r1.isContiguous()) // Outputs true
console.log(r3.isContiguous()) // Outputs false
console.log(r1.length()) // Outputs 1
console.log(r3.length()) // Outputs 9
console.log(r3.enclosingContiguousRange()) // Outputs [-3 9)
console.log(r1.empty()) // Outputs false
console.log(r4.empty()) // Outputs true
console.log(r2.includes(r3)) // Outputs true
console.log(r1.equals(new Range(3, 4))) // Outputs true
```

Do arithmetic!
```
console.log(r1.add(r2)) // Outputs [[2 6)]
console.log(r2.add(r3)) // Outputs [[-3 5), 8]
console.log(r1.add(r4)) // Outputs [3]
console.log(r3.subtract(r1)) // Outputs [[-3 3), 4, 8]
```