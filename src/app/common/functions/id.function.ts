export function newId(label: string = '') {
  return (
    label +
    'axxxxxxxxxxx'.replace(/[x]/g, () => {
      // eslint-disable-next-line no-bitwise
      const val = (Math.random() * 16) | 0;
      return val.toString(16);
    })
  );
}
