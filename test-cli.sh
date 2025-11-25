#!/bin/bash
# CLI Integration Test Script

echo "🧪 Testing CLI Tool..."
echo "=================================================="

# Create a test HTML file
cat > test-page.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <button>Button without attribute</button>
    <button data-testID="btn-ok">Button with attribute</button>
    <a href="#">Link without attribute</a>
    <a href="#" data-testID="link-ok">Link with attribute</a>
</body>
</html>
EOF

# Start a simple HTTP server in background
python3 -m http.server 8000 > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 2

echo ""
echo "📋 Test: CLI with HTML output"
node dist/bin/playwright-attr-audit.js --baseUrl=http://localhost:8000/test-page.html --html=cli-test-report.html --no-progress

if [ -f "cli-test-report.html" ]; then
    echo "✅ PASS: CLI generated HTML report"
    rm -f cli-test-report.html
else
    echo "❌ FAIL: CLI did not generate HTML report"
fi

echo ""
echo "📋 Test: CLI with JSON output"
node dist/bin/playwright-attr-audit.js --baseUrl=http://localhost:8000/test-page.html --output=cli-test-report.json --no-progress

if [ -f "cli-test-report.json" ]; then
    echo "✅ PASS: CLI generated JSON report"
    # Check if JSON is valid
    if python3 -m json.tool cli-test-report.json > /dev/null 2>&1; then
        echo "✅ PASS: JSON report is valid"
    else
        echo "❌ FAIL: JSON report is invalid"
    fi
    rm -f cli-test-report.json
else
    echo "❌ FAIL: CLI did not generate JSON report"
fi

# Cleanup
kill $SERVER_PID 2>/dev/null
rm -f test-page.html

echo ""
echo "=================================================="
echo "✅ CLI tests completed!"

