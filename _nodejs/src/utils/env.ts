export default {
  isDev() {
    return process.env.NODE_ENV === "development";
  },
  isProd() {
    return process.env.NODE_ENV === "production";
  },
};
