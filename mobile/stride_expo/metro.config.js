const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Block node-fetch import for web/mobile platforms
  if (
    moduleName === '@supabase/node-fetch' ||
    moduleName.includes('async-require')
  ) {
    return {
      type: 'empty',
    };
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
