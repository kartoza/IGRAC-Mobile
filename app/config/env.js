module.exports = global.__TEST__ ? "" : __DEV__ ? require("./env.dev") : require("./env.prod")
