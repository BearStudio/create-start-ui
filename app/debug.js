export const debug = (...params) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...params);
  }
};
