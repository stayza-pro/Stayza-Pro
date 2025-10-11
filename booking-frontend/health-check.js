#!/usr/bin/env node

/**
 * Automated Health Check Script
 * Verifies that all realtor dashboard pages are accessible and load without critical errors
 * 
 * Usage: node health-check.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Pages to test
const PAGES = [
  { path: '/', name: 'Home/Login', requiresAuth: false },
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { path: '/properties', name: 'Properties', requiresAuth: true },
  { path: '/bookings', name: 'Bookings', requiresAuth: true },
  { path: '/analytics', name: 'Analytics', requiresAuth: true },
  { path: '/notifications', name: 'Notifications', requiresAuth: true },
  { path: '/revenue', name: 'Revenue', requiresAuth: true },
  { path: '/review-moderation', name: 'Review Moderation', requiresAuth: true },
  { path: '/refund-requests', name: 'Refund Requests', requiresAuth: true },
  { path: '/payments', name: 'Payments', requiresAuth: true },
  { path: '/settings', name: 'Settings', requiresAuth: true },
];

// API endpoints to test
const API_ENDPOINTS = [
  { path: '/api/health', name: 'Health Check', method: 'GET' },
  { path: '/api/auth/me', name: 'Auth - Get Current User', method: 'GET' },
  { path: '/api/bookings', name: 'Bookings - Get All', method: 'GET' },
  { path: '/api/analytics', name: 'Analytics - Get Stats', method: 'GET' },
  { path: '/api/notifications', name: 'Notifications - Get All', method: 'GET' },
  { path: '/api/properties', name: 'Properties - Get All', method: 'GET' },
];

/**
 * Make HTTP request
 */
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const startTime = Date.now();

    const req = lib.request(url, { method, timeout: TIMEOUT }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test a single page
 */
async function testPage(page) {
  const url = `${BASE_URL}${page.path}`;
  
  try {
    const result = await makeRequest(url);
    
    // Check if page loads (200 OK) or redirects to login (302/401 for auth pages)
    if (result.statusCode === 200) {
      console.log(`${colors.green}✓${colors.reset} ${page.name.padEnd(25)} - ${colors.green}OK${colors.reset} (${result.responseTime}ms)`);
      return { success: true, page: page.name, responseTime: result.responseTime };
    } else if (page.requiresAuth && (result.statusCode === 302 || result.statusCode === 401)) {
      console.log(`${colors.yellow}○${colors.reset} ${page.name.padEnd(25)} - ${colors.yellow}Requires Auth${colors.reset} (Redirect to login)`);
      return { success: true, page: page.name, note: 'Auth required' };
    } else {
      console.log(`${colors.red}✗${colors.reset} ${page.name.padEnd(25)} - ${colors.red}Failed${colors.reset} (Status: ${result.statusCode})`);
      return { success: false, page: page.name, statusCode: result.statusCode };
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${page.name.padEnd(25)} - ${colors.red}Error${colors.reset} (${error.message})`);
    return { success: false, page: page.name, error: error.message };
  }
}

/**
 * Test API endpoint
 */
async function testAPIEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  
  try {
    const result = await makeRequest(url, endpoint.method);
    
    if (result.statusCode === 200 || result.statusCode === 401) {
      // 401 is acceptable for endpoints requiring auth
      const status = result.statusCode === 200 ? 'OK' : 'Auth Required';
      const color = result.statusCode === 200 ? colors.green : colors.yellow;
      console.log(`${color}✓${colors.reset} ${endpoint.name.padEnd(35)} - ${color}${status}${colors.reset} (${result.responseTime}ms)`);
      return { success: true, endpoint: endpoint.name, responseTime: result.responseTime };
    } else {
      console.log(`${colors.red}✗${colors.reset} ${endpoint.name.padEnd(35)} - ${colors.red}Failed${colors.reset} (Status: ${result.statusCode})`);
      return { success: false, endpoint: endpoint.name, statusCode: result.statusCode };
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${endpoint.name.padEnd(35)} - ${colors.red}Error${colors.reset} (${error.message})`);
    return { success: false, endpoint: endpoint.name, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runHealthCheck() {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║      Stayza Dashboard - Health Check             ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`${colors.blue}Testing Base URL:${colors.reset} ${BASE_URL}\n`);

  // Test if server is running
  console.log(`${colors.blue}1. Checking if server is running...${colors.reset}\n`);
  try {
    await makeRequest(BASE_URL);
    console.log(`${colors.green}✓ Server is running${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}✗ Server is not running or not accessible${colors.reset}`);
    console.log(`${colors.red}  Error: ${error.message}${colors.reset}\n`);
    console.log(`${colors.yellow}Please start the development server first:${colors.reset}`);
    console.log(`${colors.yellow}  cd booking-frontend && npm run dev${colors.reset}\n`);
    process.exit(1);
  }

  // Test pages
  console.log(`${colors.blue}2. Testing Dashboard Pages...${colors.reset}\n`);
  const pageResults = [];
  for (const page of PAGES) {
    const result = await testPage(page);
    pageResults.push(result);
  }

  console.log(`\n${colors.blue}3. Testing API Endpoints...${colors.reset}\n`);
  const apiResults = [];
  for (const endpoint of API_ENDPOINTS) {
    const result = await testAPIEndpoint(endpoint);
    apiResults.push(result);
  }

  // Summary
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║              Test Summary                         ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);

  const pagesPassed = pageResults.filter(r => r.success).length;
  const pagesTotal = pageResults.length;
  const apiPassed = apiResults.filter(r => r.success).length;
  const apiTotal = apiResults.length;

  console.log(`${colors.blue}Pages:${colors.reset}`);
  console.log(`  ${colors.green}✓ Passed:${colors.reset} ${pagesPassed}/${pagesTotal}`);
  console.log(`  ${colors.red}✗ Failed:${colors.reset} ${pagesTotal - pagesPassed}/${pagesTotal}\n`);

  console.log(`${colors.blue}API Endpoints:${colors.reset}`);
  console.log(`  ${colors.green}✓ Passed:${colors.reset} ${apiPassed}/${apiTotal}`);
  console.log(`  ${colors.red}✗ Failed:${colors.reset} ${apiTotal - apiPassed}/${apiTotal}\n`);

  // Calculate average response time
  const responseTimes = [...pageResults, ...apiResults]
    .filter(r => r.responseTime)
    .map(r => r.responseTime);
  
  if (responseTimes.length > 0) {
    const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    console.log(`${colors.blue}Performance:${colors.reset}`);
    console.log(`  Average Response Time: ${avgResponseTime}ms\n`);
  }

  // Overall status
  const allPassed = pagesPassed === pagesTotal && apiPassed === apiTotal;
  if (allPassed) {
    console.log(`${colors.green}✓ All checks passed! Dashboard is healthy.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}⚠ Some checks failed. Review the results above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the health check
runHealthCheck().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
