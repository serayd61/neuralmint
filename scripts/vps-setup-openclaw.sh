#!/usr/bin/env bash
# ============================================================
# NeuralMint — OpenClaw VPS Setup Script
# Run this on your Hetzner VPS: ssh root@188.245.241.149
# ============================================================
set -euo pipefail

echo "🔧 NeuralMint — OpenClaw VPS Setup"
echo "===================================="

# ---- 1. Generate a secure API token ----
API_TOKEN=$(openssl rand -hex 32)
echo ""
echo "✅ Generated API Token (save this for .env.local):"
echo "   OPENCLAW_API_TOKEN=${API_TOKEN}"
echo ""

# ---- 2. Configure OpenClaw Gateway ----
echo "📝 Configuring OpenClaw Gateway..."

# Enable HTTP API and set auth token
openclaw configure --set gateway.auth.token="${API_TOKEN}"
openclaw configure --set gateway.http.endpoints.chatCompletions.enabled=true
openclaw configure --set gateway.http.host="0.0.0.0"

echo "✅ Gateway configured: HTTP API enabled, auth token set"

# ---- 3. Install nginx reverse proxy with HTTPS ----
echo ""
echo "📦 Installing nginx..."
apt-get update -qq && apt-get install -y -qq nginx certbot python3-certbot-nginx

# Create nginx config for OpenClaw API
cat > /etc/nginx/sites-available/openclaw-api << 'NGINX'
server {
    listen 80;
    server_name _;

    # OpenClaw Gateway API (proxied)
    location /v1/ {
        proxy_pass http://127.0.0.1:18789;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts for long AI generation
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Stable Diffusion API (if running)
    location /sdapi/ {
        proxy_pass http://127.0.0.1:7860;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 180s;
        proxy_send_timeout 180s;
    }

    # Health check
    location /health {
        return 200 '{"status":"ok","service":"openclaw-gateway"}';
        add_header Content-Type application/json;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/openclaw-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "✅ Nginx reverse proxy configured on port 80"

# ---- 4. Firewall rules ----
echo ""
echo "🔒 Configuring firewall..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP (nginx)
ufw allow 443/tcp  # HTTPS (future)
# Keep 18789 and 7860 on loopback only (proxied through nginx)
ufw --force enable 2>/dev/null || true

echo "✅ Firewall configured"

# ---- 5. Check OpenClaw model status ----
echo ""
echo "📊 Checking available models..."
openclaw models status 2>/dev/null || echo "⚠️  Run 'openclaw models status' to check available models"

# ---- 6. Restart Gateway ----
echo ""
echo "🔄 Restarting OpenClaw Gateway..."
openclaw gateway restart 2>/dev/null || echo "⚠️  Restart Gateway manually: openclaw gateway restart"

echo ""
echo "===================================="
echo "✅ Setup Complete!"
echo ""
echo "Add these to your NeuralMint .env.local:"
echo "  OPENCLAW_API_URL=http://188.245.241.149"
echo "  OPENCLAW_API_TOKEN=${API_TOKEN}"
echo "  OPENCLAW_AGENT_ID=main"
echo ""
echo "Test with:"
echo "  curl -s http://188.245.241.149/health"
echo "  curl -s http://188.245.241.149/v1/chat/completions \\"
echo "    -H 'Authorization: Bearer ${API_TOKEN}' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"model\":\"openclaw:main\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'"
echo ""
echo "===================================="
