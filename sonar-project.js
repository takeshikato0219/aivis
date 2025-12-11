const sonarqubeScanner = require('sonarqube-scanner');

sonarqubeScanner(
  {
    serverUrl: process.env.SONAR_HOST_URL || 'http://localhost:9000',
    token: process.env.SONAR_TOKEN,
    options: {
      'sonar. projectKey':
        process.env.CI_PROJECT_NAME || process.env.SONAR_PROJECT_KEY || 'react-native-app',
      'sonar.projectName':
        process.env.CI_PROJECT_NAME || process.env.SONAR_PROJECT_NAME || 'React Native App',
      'sonar. projectVersion': '1.0.0',
      'sonar.sources': 'src',
      'sonar. tests': 'src',
      'sonar.test.inclusions': '**/*.test.ts,**/*. test.tsx',
      'sonar.exclusions':
        '**/*. test.ts,**/*.test. tsx,**/node_modules/**,**/coverage/**,**/*. styles.ts,**/android/**,**/ios/**',
      'sonar.typescript. lcov.reportPaths': 'coverage/lcov.info',
      'sonar.javascript. lcov.reportPaths': 'coverage/lcov.info',
      'sonar.sourceEncoding': 'UTF-8',
      'sonar.qualitygate.wait': true,
    },
  },
  () => {
    console.log('✅ SonarQube analysis completed');
  }
);
