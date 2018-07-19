export const highlight = function(text: string, indices: number[][]) {
  console.log(text, indices);
  let result = '';
  let prev: number[] | null = null;
  indices.forEach((cur, index) => {
    result += text.substring(prev === null ? 0 : prev[1] + 1, cur[0]) + '<b>' + text.substring(cur[0], cur[1] + 1) + '</b>';
    prev = cur;
  });
  if (prev !== null) {
    result += text.substring(prev[1] + 1);
  }
  return result.replace(/\s/g, '&nbsp;');
};
