export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunkedArr: T[][] = [];
  let index = 0;

  while (index < arr.length) {
    chunkedArr.push(arr.slice(index, index + size));
    index += size;
  }

  return chunkedArr;
}
