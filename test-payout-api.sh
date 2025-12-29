#!/bin/bash

# Payout System Automated Tests
# Run this after starting backend server on localhost:5050

echo "======================================"
echo "PAYOUT SYSTEM - AUTOMATED TESTS"
echo "======================================"
echo ""

BASE_URL="http://localhost:5050/api"
TEST_RESULTS=()
PASSED=0
FAILED=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local headers=$4
    local data=$5
    local expected_status=$6
    
    echo "Testing: $name"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}${endpoint}" ${headers})
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}${endpoint}" ${headers} -d "${data}")
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} - Status: $status"
        PASSED=$((PASSED + 1))
        TEST_RESULTS+=("✓ $name")
    else
        echo -e "${RED}✗ FAILED${NC} - Expected: $expected_status, Got: $status"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
        TEST_RESULTS+=("✗ $name")
    fi
    echo ""
}

echo "======================================"
echo "1. Testing Backend Server Health"
echo "======================================"
echo ""

# Test 1: Health Check
test_endpoint \
    "Health Check" \
    "GET" \
    "/health" \
    "" \
    "" \
    "200"

echo "======================================"
echo "2. Testing Payout Endpoints (No Auth)"
echo "======================================"
echo ""

# Test 2: Get Banks List
test_endpoint \
    "Get Banks List" \
    "GET" \
    "/realtors/payout/banks" \
    "-H 'Content-Type: application/json'" \
    "" \
    "200"

echo "======================================"
echo "3. Testing Protected Endpoints"
echo "======================================"
echo ""
echo -e "${YELLOW}Note: These tests will fail without valid auth token${NC}"
echo ""

# Test 3: Get Payout Settings (Requires Auth)
test_endpoint \
    "Get Payout Settings (No Auth - Should Fail)" \
    "GET" \
    "/realtors/payout/settings" \
    "-H 'Content-Type: application/json'" \
    "" \
    "401"

# Test 4: Verify Bank Account (Requires Auth)
test_endpoint \
    "Verify Bank Account (No Auth - Should Fail)" \
    "POST" \
    "/realtors/payout/verify" \
    "-H 'Content-Type: application/json'" \
    '{"accountNumber":"0123456789","bankCode":"058"}' \
    "401"

# Test 5: Save Bank Account (Requires Auth)
test_endpoint \
    "Save Bank Account (No Auth - Should Fail)" \
    "POST" \
    "/realtors/payout/account" \
    "-H 'Content-Type: application/json'" \
    '{"bankCode":"058","bankName":"GTBank","accountNumber":"0123456789","accountName":"Test"}' \
    "401"

# Test 6: Get Pending Payouts (Requires Auth)
test_endpoint \
    "Get Pending Payouts (No Auth - Should Fail)" \
    "GET" \
    "/realtors/payouts/pending" \
    "-H 'Content-Type: application/json'" \
    "" \
    "401"

# Test 7: Get Payout History (Requires Auth)
test_endpoint \
    "Get Payout History (No Auth - Should Fail)" \
    "GET" \
    "/realtors/payouts/history" \
    "-H 'Content-Type: application/json'" \
    "" \
    "401"

# Test 8: Request Payout (Requires Auth)
test_endpoint \
    "Request Payout (No Auth - Should Fail)" \
    "POST" \
    "/realtors/payouts/request" \
    "-H 'Content-Type: application/json'" \
    '{"amount":50000}' \
    "401"

echo "======================================"
echo "TEST SUMMARY"
echo "======================================"
echo ""
echo "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""
echo "Detailed Results:"
for result in "${TEST_RESULTS[@]}"; do
    echo "  $result"
done
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
