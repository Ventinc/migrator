export const logger = {
  log(...values) {
    if (process.env.NODE_ENV !== "test") {
      console.log(...values);
    }
  },
};
