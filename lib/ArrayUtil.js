/* Copyright (C) 2017-2018 Project-ODE
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * ODE-FeatureService module for array utilities
 * Author: Erwan Keribin
 */
'use strict';

module.exports.random = Math.random;

// https://stackoverflow.com/a/2450976/2730032
function shuffle(array) {
    var currentIndex = array.length;
    var temporaryValue;
    var randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(module.exports.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

// https://stackoverflow.com/a/47225591/2730032
function partition(array, isValid) {
    return array.reduce(([pass, fail], elem) => {
        return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
    }, [[], []]);
}

/* multDistributeSequential(array, multiplier, nBags) returns an array of arrays
We want to distribute each element of 'array' a 'multiplier' amount of times amongst nBags arrays.
We want this done in a predictable sequential manner.
Here we will first build a distributionArray of length array.length*multiplier,
this array will contain multiplier times each element of array.
We then distribute the elements of distributionArray in nBags array.
Using nBagElements as a float and Array.slice we manage this in a equal manner,
however we should probably prove that this works every time.
*/
function multDistributeSequential(array, multiplier, nBags) {
    let distributionArray = [];
    let res = [];
    for (let x = 0; x < multiplier; x++) {
        distributionArray = distributionArray.concat(array);
    }
    let nBagElements = distributionArray.length / nBags;
    for (let x = 0; x < nBags; x++) {
        let start = x * nBagElements;
        let end = (x + 1) * nBagElements;
        res.push(distributionArray.slice(start, end));
    }
    return res;
}

/* multDistributeRandom(array, multiplier, nBags) returns an array of arrays
We want to distribute each element of 'array' a 'multiplier' amount of times amongst nBags arrays.
We want this done in a random manner.
The idea is to iterate nBags time and fill one array at a time (res[bag]),
we first calculate how many elements res[bag] should have (targetLength),
then we fill it with up to targetLength from distributionArray (initiliazed with shuffle(array)),
if targetLength is not achieved we refill distributionArray starting with unused array elements,
we finish filling res[bag] with unused elements and keep the rest of distributionArray for later.
This seems to achieved the desired effect but should be checked for randomness quality.
*/
function multDistributeRandom(array, multiplier, nBags) {
    let targetTotalLength = array.length * multiplier;
    let nBagElements = Math.floor(targetTotalLength / nBags);
    let nExtraElements = targetTotalLength % nBags;
    let res = [];
    let distributionArray = [];
    for (let bag = 0; bag < nBags; bag++) {
        let targetLength = nBagElements;
        // We try to distribute nExtraElements equally amongst the first bags
        if (nExtraElements > 0) {
            targetLength++;
            nExtraElements--;
        }
        if (distributionArray.length === 0) {
            distributionArray = shuffle(array.slice());
        }
        res.push(distributionArray.splice(0, targetLength));
        if (res[bag].length === targetLength) {
            continue;
        }
        // Logically if we get here that means distributionArray is empty
        // We refill it starting with elements that aren't in res[bag]
        let [unusedElements, usedElements] = partition(array, (e) => !res[bag].includes(e));
        distributionArray = shuffle(unusedElements).concat(shuffle(usedElements));
        // We should have enough unused elements to fill res[bag], the rest are for the next bag
        res[bag] = res[bag].concat(distributionArray.splice(0, targetLength - res[bag].length));
    }
    return res;
}

module.exports.multDistributeSequential = multDistributeSequential;
module.exports.multDistributeRandom = multDistributeRandom;
