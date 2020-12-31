/*
	Called during development only. Allows us to use ES6 and JSX in our server code.
*/

require('@babel/register')({
  presets: ["@babel/preset-env",
  "@babel/react"]
});

require("./src/server/index")
