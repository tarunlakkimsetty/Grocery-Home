#!/usr/bin/env node

/**
 * API Endpoint Verification Script
 * Tests backend API endpoints to verify deployment
 * 
 * Usage: 
 *   node backend/scripts/testApiEndpoints.js                    (test local http://localhost:5000)
 *   node backend/scripts/testApiEndpoints.js https://api-url    (test remote deployment)
 */

const http = require('http');
const https = require('https');

const baseUrl = process.argv[2] || 'http://localhost:5000';

const tests = [
    {
        name: 'Root endpoint',
        path: '/',
        method: 'GET',
        expectStatus: 200,
        description: 'Basic API availability check'
    },
    {
        name: 'Health check',
        path: '/api/health',
        method: 'GET',
        expectStatus: 200,
        description: 'Database connectivity check'
    },
    {
        name: 'Public products',
        path: '/api/products?limit=1',
        method: 'GET',
        expectStatus: 200,
        description: 'Public endpoint (no auth required)'
    },
    {
        name: '404 endpoint',
        path: '/api/nonexistent',
        method: 'GET',
        expectStatus: 404,
        description: 'Error handling verification'
    }
];

let passed = 0;
let failed = 0;

function makeRequest(url, method) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        const parsedUrl = new URL(url);

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + parsedUrl.search,
            method: method,
            timeout: 5000
        };

        const request = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        request.on('error', reject);
        request.on('timeout', () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });

        request.end();
    });
}

async function runTests() {
    console.log('\n🧪 API Endpoint Verification\n');
    console.log(`Testing: ${baseUrl}`);
    console.log('═'.repeat(70));

    for (const test of tests) {
        try {
            const url = `${baseUrl}${test.path}`;
            console.log(`\n📍 ${test.name}`);
            console.log(`   ${test.description}`);
            console.log(`   GET ${test.path}`);

            const response = await makeRequest(url, test.method);
            
            if (response.status === test.expectStatus) {
                console.log(`   ✅ Status: ${response.status} (expected ${test.expectStatus})`);
                if (response.data && typeof response.data === 'object') {
                    console.log(`   📦 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
                }
                passed++;
            } else {
                console.log(`   ❌ Status: ${response.status} (expected ${test.expectStatus})`);
                if (response.data && typeof response.data === 'object') {
                    console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
                }
                failed++;
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            failed++;
        }
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);

    if (failed === 0) {
        console.log('\n✅ All tests passed! Backend is operational.\n');
        process.exit(0);
    } else {
        console.log(`\n⚠️  ${failed} test(s) failed. Check the errors above.\n`);
        process.exit(1);
    }
}

console.log('\n🚀 Starting tests...');
runTests().catch(err => {
    console.error('\n💥 Fatal error:', err.message);
    process.exit(1);
});
