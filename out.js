const fs = require("fs");
const glob = require("glob");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

// Function to obfuscate a JavaScript file
function obfuscateFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const obfuscatedContent = JavaScriptObfuscator.obfuscate(content, {
    compact: true,
    controlFlowFlattening: true,
  }).getObfuscatedCode();
  fs.writeFileSync(filePath, obfuscatedContent, "utf-8");
}

// Function to copy a folder recursively
function copyFolderSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source);

  items.forEach((item) => {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);

    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolderSync(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

// Define source and destination directories
const sourceDir = path.join(__dirname, "public", "images");
const destDir = path.join(__dirname, "dist", "images");

// Copy the image folder
copyFolderSync(sourceDir, destDir);

// Copy background.js from public directory to out directory
const backgroundSource = path.join(__dirname, "public", "background.js");
const backgroundDestination = path.join(__dirname, "out", "background.js");
fs.copyFileSync(backgroundSource, backgroundDestination);
obfuscateFile(backgroundDestination); // Obfuscate the copied file

// Copy offscreen.html from public directory to out directory
const offscreenHtmlSource = path.join(__dirname, "public", "offscreen.html");
const offscreenHtmlDestination = path.join(__dirname, "out", "offscreen.html");
fs.copyFileSync(offscreenHtmlSource, offscreenHtmlDestination);

// Copy offscreen.js from public directory to out directory
const offscreenJsSource = path.join(__dirname, "public", "offscreen.js");
const offscreenJsDestination = path.join(__dirname, "out", "offscreen.js");
fs.copyFileSync(offscreenJsSource, offscreenJsDestination);
obfuscateFile(offscreenJsDestination); // Obfuscate the copied file

// Copy inject.js from public directory to out directory
const injectJsSource = path.join(__dirname, "public", "inject.js");
const injectJsDestination = path.join(__dirname, "out", "inject.js");
fs.copyFileSync(injectJsSource, injectJsDestination);
obfuscateFile(injectJsDestination); // Obfuscate the copied file

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
if (fs.existsSync(sourcePath)) {
  fs.renameSync(sourcePath, destinationPath);
}
