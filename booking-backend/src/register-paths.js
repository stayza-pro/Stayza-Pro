// Register tsconfig path aliases for runtime
const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

// Get the base URL from project root
const baseUrl = path.resolve(__dirname);

// Register paths from tsconfig.json
tsConfigPaths.register({
  baseUrl,
  paths: {
    '@/*': ['*'],
    '@/config/*': ['config/*'],
    '@/controllers/*': ['controllers/*'],
    '@/middleware/*': ['middleware/*'],
    '@/routes/*': ['routes/*'],
    '@/services/*': ['services/*'],
    '@/types/*': ['types/*'],
    '@/utils/*': ['utils/*'],
  },
});
