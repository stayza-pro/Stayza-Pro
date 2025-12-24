#!/bin/bash

# Local Subdomain Testing Setup Script
# Run this to configure local subdomain testing

echo "🚀 Setting up local subdomain testing for Multi-Tenant Realtor Booking SaaS"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Windows;;
    MINGW*)     MACHINE=Windows;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "Detected OS: ${MACHINE}"
echo ""

# Define hosts file location
if [ "$MACHINE" = "Windows" ]; then
    HOSTS_FILE="C:\\Windows\\System32\\drivers\\etc\\hosts"
else
    HOSTS_FILE="/etc/hosts"
fi

echo "Hosts file location: ${HOSTS_FILE}"
echo ""

# Example subdomains to add
SUBDOMAINS=(
    "anderson-properties.localhost"
    "john-realtor.localhost"
    "test-realtor.localhost"
)

echo "📝 Subdomains to add:"
for subdomain in "${SUBDOMAINS[@]}"; do
    echo "   - ${subdomain}"
done
echo ""

# Check if running with sudo (Linux/Mac)
if [ "$MACHINE" != "Windows" ]; then
    if [ "$EUID" -ne 0 ]; then 
        echo -e "${RED}❌ This script needs sudo permissions to edit hosts file${NC}"
        echo ""
        echo "Please run with:"
        echo "  sudo bash setup-local-subdomains.sh"
        echo ""
        exit 1
    fi
fi

echo "⚠️  This will modify your hosts file: ${HOSTS_FILE}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "📝 Backing up hosts file..."

# Backup hosts file
if [ "$MACHINE" = "Windows" ]; then
    cp "${HOSTS_FILE}" "${HOSTS_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
else
    cp "${HOSTS_FILE}" "${HOSTS_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
fi

echo -e "${GREEN}✅ Backup created${NC}"
echo ""

# Add entries
echo "✍️  Adding subdomain entries..."

for subdomain in "${SUBDOMAINS[@]}"; do
    # Check if entry already exists
    if grep -q "127.0.0.1 ${subdomain}" "${HOSTS_FILE}"; then
        echo -e "${YELLOW}⚠️  ${subdomain} already exists, skipping${NC}"
    else
        echo "127.0.0.1 ${subdomain}" >> "${HOSTS_FILE}"
        echo -e "${GREEN}✅ Added ${subdomain}${NC}"
    fi
done

echo ""
echo "🎉 Setup complete!"
echo ""
echo "You can now access:"
for subdomain in "${SUBDOMAINS[@]}"; do
    echo "   http://${subdomain}:3000"
done
echo ""

# Flush DNS cache
echo "🔄 Flushing DNS cache..."
if [ "$MACHINE" = "Mac" ]; then
    sudo dscacheutil -flushcache
    sudo killall -HUP mDNSResponder
    echo -e "${GREEN}✅ DNS cache flushed${NC}"
elif [ "$MACHINE" = "Linux" ]; then
    if command -v systemd-resolve &> /dev/null; then
        sudo systemd-resolve --flush-caches
        echo -e "${GREEN}✅ DNS cache flushed${NC}"
    else
        echo -e "${YELLOW}⚠️  No systemd-resolve found, you may need to restart browser${NC}"
    fi
elif [ "$MACHINE" = "Windows" ]; then
    ipconfig /flushdns
    echo -e "${GREEN}✅ DNS cache flushed${NC}"
fi

echo ""
echo "📖 Next steps:"
echo "   1. Start backend: cd booking-backend && npm run dev"
echo "   2. Start frontend: cd booking-frontend && npm run dev"
echo "   3. Visit: http://anderson-properties.localhost:3000"
echo ""
echo "🐛 Troubleshooting:"
echo "   - If subdomain doesn't work, restart your browser"
echo "   - Check middleware logs in terminal"
echo "   - Verify hosts file: cat ${HOSTS_FILE}"
echo ""
