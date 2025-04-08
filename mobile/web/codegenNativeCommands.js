// Mock implementation for web
export default function codegenNativeCommands(options) {
  const commands = {};
  Object.keys(options).forEach(key => {
    commands[key] = () => {};
  });
  return commands;
} 