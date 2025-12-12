const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
const fs = require('fs');

// Load .env file manually for webpack
function loadEnvFile() {
  const envPath = path.resolve(__dirname, '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, '');
          env[key] = cleanValue;
        }
      }
    });
  }
  
  return env;
}

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Load .env file
  const envVars = loadEnvFile();
  
  // Add environment variables to DefinePlugin
  const DefinePlugin = require('webpack').DefinePlugin;
  
  // Create process.env object with all environment variables
  const processEnv = {
    ...process.env,
    ...envVars,
  };
  
  // Build DefinePlugin definitions
  const definitions = {
    // Define process object for web compatibility
    'process': JSON.stringify({
      env: processEnv,
    }),
    'process.env': JSON.stringify(processEnv),
  };
  
  // Add each EXPO_PUBLIC_* variable explicitly for easier access
  Object.keys(envVars).forEach((key) => {
    if (key.startsWith('EXPO_PUBLIC_')) {
      definitions[`process.env.${key}`] = JSON.stringify(envVars[key]);
    }
  });
  
  // Find and update existing DefinePlugin or add new one
  const existingDefinePluginIndex = config.plugins.findIndex(
    (plugin) => plugin.constructor.name === 'DefinePlugin'
  );
  
  if (existingDefinePluginIndex >= 0) {
    // Merge with existing DefinePlugin
    const existingPlugin = config.plugins[existingDefinePluginIndex];
    config.plugins[existingDefinePluginIndex] = new DefinePlugin({
      ...existingPlugin.definitions,
      ...definitions,
    });
  } else {
    // Add new DefinePlugin
    config.plugins.push(new DefinePlugin(definitions));
  }
  
  return config;
};

