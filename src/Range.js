import TinyRange from 'tiny-range';
import isNumber from 'is-number';
import assert from 'assert';

class ContiguousRange {
    constructor(x, y) {
        if (y == undefined) {
            if (typeof x === 'string') {
                // Range('0-2')
                const range = TinyRange.parse(x);
                assert(range.length == 1);
                this.start = range.start;
                this.end = range.end;
            } else if (Array.isArray(x)) {
                // Range([0, 2])
                assert(
                    x.length == 2 
                    && isNumber(x[0]) 
                    && isNumber(x[1])
                    && x[0] <= x[1],
                    'Array initializer must contain 2 numbers, the first > the second.'
                );
                this.start = x[0];
                this.end = x[1];
            } else if (x instanceof ContiguousRange) {
                this.start = x.start;
                this.end = x.end;
            } else {
                assert(false, 'Invalid ContiguousRange constructor arguments: ' + Array.prototype.slice.call(arguments));
            }
        } else {
            // Range(0, 2)
            assert(isNumber(x) && isNumber(y) && x <= y);
            this.start = x;
            this.end = y;
        }
        
    }
    
    toString() {
        return this.length() == 1 ? this.start : '[' + this.start + ' ' + this.end + ')';
    }
    
    length() {
        return this.end - this.start;
    }
    
    empty() {
        return this.length() == 0;
    }
    
    subtract(other) {
        let distance = undefined;
        if (this.start < other.start) {
            if (this.end > other.start) {
                if (this.end > other.end) {
                    // [return[0].start return[0].end]                     [return[1].start return[1].end]
                    // [this.start                   [other.start other.end]                     this.end]
                    return new Range([this.start, other.start], [other.end, this.end]);
                } else {
                    // [return.start return.end]
                    // [this.start             [other.start this.end] other.end]
                    return new Range(this.start, other.start);
                }
            } else {
                // [return.start return.end]                       
                // [this.start     this.end] [other.start other.end]
                return new Range(this);
            }
        } else {
            if (other.end > this.start) {
                if (other.end > this.end) {
                    // return is empty.
                    // [other.start [this.start this.end] other.end]
                    return new Range();
                } else {
                    //                                    [return.start return.end]
                    // [other.start [this.start  other.end]               this.end]
                    return new Range(other.end, this.end);
                }
            } else {
                //                         [return.start return.end]
                // [other.start other.end] [this.start     this.end]
                return new Range(this);
            }
        }
    }
}

class Range {
    
    static MAX = Number.POSITIVE_INFINITY;
    static MIN = Number.NEGATIVE_INFINITY;
    
    constructor() {
        const args = Array.prototype.slice.call(arguments);
        if (args.length == 0) {
            // Range() -> empty range
            this.contiguous_ranges = [];
        } else if (args.length == 1) {
            let a = args[0];
            if (typeof a === 'string') {
                    // Range('0-2, 4-7')
                this.contiguous_ranges = TinyRange.parse(a);
            } else if (Array.isArray(a)) {
                if (a.length == 0) { 
                    // Range([])
                    this.contiguous_ranges = [];
                } else if (Array.isArray(a[0])) {
                    // Range([[0, 2], [4, 7]])
                    const raw_ranges = a.map(contiguous_range_init => new ContiguousRange(contiguous_range_init));
                    this.contiguous_ranges = [];
                    raw_ranges.forEach(contiguous_range => {
                        this.contiguous_ranges = this.add(new Range(contiguous_range)).contiguous_ranges;
                    });
                    console.log(this.contiguous_ranges);
                } else if (isNumber(a[0])) {
                    // Range([0, 2])
                    this.contiguous_ranges = [new ContiguousRange(a)];
                } else if (a[0] instanceof ContiguousRange) {
                    // Range([[new ContiguousRange(0, 1), new ContiguousRange(2, 4)]])
                    this.contiguous_ranges = a.map(a => a);
                } else {
                    assert(false, 'Invalid Range constructor args: ' + args);
                }
            } else if (a instanceof Range) {
                // Range(other_range)
                this.contiguous_ranges = a.contiguous_ranges;
            } else if (a instanceof ContiguousRange) {
                this.contiguous_ranges = [a];
            } else {
                assert(false, 'Invalid Range constructor args: ' + args);
            }
        } else if (args.length == 2 && isNumber(args[0])) {
            // Range(0, 2);
            this.contiguous_ranges = [new ContiguousRange(args)];
        } else {
            // Range([0, 2], [4, 7]);
            this.contiguous_ranges = args.map(contiguous_range_init => new ContiguousRange(contiguous_range_init));
        }
    }
    
    toString() {
        return '[' + this.contiguous_ranges.map(r => r.toString()).join(', ') + ']';
    }
    
    empty() {
        return this.length() == 0;
    }
    
    length() {
        return this.contiguous_ranges.reduce((total, contiguous_range) => total + contiguous_range.length(), 0);
    }
    
    contiguousParts() {
        return this.contiguous_ranges;
    }
    
    isContiguous() {
        return this.contiguous_ranges.length <= 1;
    }
    
    enclosingContiguousRange() {
        return this.isContiguous() ? this : new ContiguousRange(this.contiguous_ranges[0].start, this.contiguous_ranges[this.contiguous_ranges.length - 1].end);
    }
    
    equals(other) {
        return this.includes(other) && other.includes(this);
    }
    
    includes(other) {
        return this.subtract(other).empty()
    }
    
    overlaps(other) {
        return !this.subtract(other).equals(this);
    }
    
    subtract(other) {
        let difference_ranges = [];
        this.contiguous_ranges.forEach(contiguous_range => {
            let remaining = [contiguous_range];
            other.contiguous_ranges.forEach(other_contiguous_range => {
                let new_remaining = [];
                remaining.forEach(remaining_contiguous_range => {
                    new_remaining = new_remaining.concat(remaining_contiguous_range.subtract(other_contiguous_range).contiguous_ranges)
                });
                remaining = new_remaining;
            });
            difference_ranges = difference_ranges.concat(remaining);
        });
        return new Range(difference_ranges);
    }
    
    add(other) {
        if (other.empty()) {
            return this;
        }
        if (this.empty()) {
            return other;
        }
        const enclosing = new Range(
            Math.min(
                this.contiguous_ranges[0].start, 
                other.contiguous_ranges[0].start
            ), 
            Math.max(
                this.contiguous_ranges[this.contiguous_ranges.length - 1].end, 
                other.contiguous_ranges[other.contiguous_ranges.length - 1].end
            )
        );
        return enclosing.subtract(enclosing.subtract(this).subtract(other));
    }
}

module.exports = Range;