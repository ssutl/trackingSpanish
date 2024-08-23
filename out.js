const fs = require("fs");
const glob = require("glob");
const path = require("path");

// Copy background.js from public directory to out directory
const backgroundSource = path.join(__dirname, "public", "background.js");
const backgroundDestination = path.join(__dirname, "out", "background.js");
fs.copyFileSync(backgroundSource, backgroundDestination);

// Copy offscreen.html from public directory to out directory
const offscreenHtmlSource = path.join(__dirname, "public", "offscreen.html");
const offscreenHtmlDestination = path.join(__dirname, "out", "offscreen.html");
fs.copyFileSync(offscreenHtmlSource, offscreenHtmlDestination);

// Copy offscreen.js from public directory to out directory
const offscreenJsSource = path.join(__dirname, "public", "offscreen.js");
const offscreenJsDestination = path.join(__dirname, "out", "offscreen.js");
fs.copyFileSync(offscreenJsSource, offscreenJsDestination);

// Modify HTML files
const files = glob.sync("out/**/*.html");
files.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8");
  const modifiedContent = content.replace(/\/_next/g, "./next");
  fs.writeFileSync(file, modifiedContent, "utf-8");
});

// Rename _next directory to next
const sourcePath = "out/_next";
const destinationPath = "out/next";

fs.rename(sourcePath, destinationPath, (err) => {
  if (err) {
    console.error("Error renaming directory:", err);
  } else {
    console.log("Directory renamed successfully");
  }
});
