function myEndsWith(str, target) {
  const targetLength = target.length;
  const strLength = str.length;

  const startPosition = strLength - targetLength;

  const slicedStr = str.slice(startPosition);

  return slicedStr === target;
}

const result = myEndsWith("Bastion", "ion");

console.log(result);
