import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../src/routes/realtorRoutes.ts');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

interface Endpoint {
  method: string;
  path: string;
  lineStart: number;
  lineEnd: number;
  role: 'ADMIN' | 'REALTOR' | 'PUBLIC' | 'AUTHENTICATED';
  middlewares: string[];
}

const endpoints: Endpoint[] = [];
let currentEndpoint: Partial<Endpoint> | null = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detect router method
  const methodMatch = line.match(/^router\.(get|post|put|delete|patch)\(/);
  if (methodMatch && currentEndpoint) {
    // Save previous endpoint
    if (currentEndpoint.lineStart !== undefined) {
      currentEndpoint.lineEnd = i - 1;
      endpoints.push(currentEndpoint as Endpoint);
    }
    currentEndpoint = null;
  }
  
  if (methodMatch) {
    currentEndpoint = {
      method: methodMatch[1].toUpperCase(),
      middlewares: [],
      lineStart: i,
      role: 'PUBLIC'
    };
    
    // Look ahead for path and middlewares
    for (let j = i; j < Math.min(i + 10, lines.length); j++) {
      const pathMatch = lines[j].match(/["']([^"']+)["']/);
      if (pathMatch && !currentEndpoint.path) {
        currentEndpoint.path = pathMatch[1];
      }
      
      // Check for role requirements
      if (lines[j].includes('requireRole("ADMIN")')) {
        currentEndpoint.role = 'ADMIN';
      } else if (lines[j].includes('requireRole("REALTOR")')) {
        currentEndpoint.role = 'REALTOR';
      } else if (lines[j].includes('authenticate')) {
        if (currentEndpoint.role === 'PUBLIC') {
          currentEndpoint.role = 'AUTHENTICATED';
        }
      }
      
      if (lines[j].includes('asyncHandler')) break;
    }
  }
}

// Save last endpoint
if (currentEndpoint?.lineStart !== undefined) {
  currentEndpoint.lineEnd = lines.length - 1;
  endpoints.push(currentEndpoint as Endpoint);
}

// Categorize
const categorized = {
  ADMIN: endpoints.filter(e => e.role === 'ADMIN'),
  REALTOR: endpoints.filter(e => e.role === 'REALTOR'),
  AUTHENTICATED: endpoints.filter(e => e.role === 'AUTHENTICATED'),
  PUBLIC: endpoints.filter(e => e.role === 'PUBLIC')
};

console.log('\n' + '='.repeat(80));
console.log('í³Š ENDPOINT CATEGORIZATION');
console.log('='.repeat(80) + '\n');

Object.entries(categorized).forEach(([category, eps]) => {
  console.log(`\ní´ ${category} ENDPOINTS (${eps.length}):`);
  console.log('â”€'.repeat(80));
  eps.forEach(ep => {
    console.log(`  ${ep.method.padEnd(7)} ${ep.path?.padEnd(50)} Lines: ${ep.lineStart}-${ep.lineEnd || '?'}`);
  });
});

console.log('\n' + '='.repeat(80));
console.log(`âœ… Total: ${endpoints.length} endpoints`);
console.log('='.repeat(80) + '\n');

// Reorganization plan
console.log('\ní²¡ REORGANIZATION PLAN:\n');
console.log('1. PUBLIC ENDPOINTS (No auth required)');
console.log('   - GET /:slug (Get realtor by slug)');
console.log('   - GET /subdomain/check');
console.log('');
console.log('2. REGISTRATION & ONBOARDING (Auth optional or minimal)');
console.log('   - POST /register');
console.log('   - POST /upload?type=temp-logo|temp-cac');
console.log('');
console.log('3. REALTOR ENDPOINTS (requireRole("REALTOR"))');
console.log('   - Profile Management (GET/PUT/DELETE /profile)');
console.log('   - CAC Verification (POST/GET /cac, PUT /cac/resubmit)');
console.log('   - File Upload (POST /upload?type=logo)');
console.log('   - Properties & Analytics');
console.log('   - Bookings Management');
console.log('   - Payout Configuration');
console.log('');
console.log('4. ADMIN ENDPOINTS (requireRole("ADMIN"))');
console.log('   - PATCH /admin/realtor/:realtorId/cac');
console.log('   - GET /admin/all');
console.log('');
console.log('5. GENERAL AUTHENTICATED (Just authenticate middleware)');
console.log('   - Mixed access endpoints with RBAC');
console.log('\n');
