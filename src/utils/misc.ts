export const roundToPrecision = (num: number, precision = 1) => {
  return parseFloat(num.toFixed(precision));
};
