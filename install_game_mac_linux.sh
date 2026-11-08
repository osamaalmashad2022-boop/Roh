#!/usr/bin/env bash
set -e

GAME_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$GAME_DIR"

echo "============================================================================"
echo "   KHEPRI: OUTRIDERS OF THE SUN - macOS & Linux PC Installer"
echo "   مثبت ومشغل اللعبة على أنظمة Mac و Linux"
echo "============================================================================"

if ! command -v node >/dev/null 2>&1; then
  echo "[!] يرجى تثبيت Node.js LTS أولاً من https://nodejs.org"
  echo "[!] Please install Node.js LTS from https://nodejs.org first."
  exit 1
fi

echo "[1/3] Node.js version: $(node -v)"

if [ ! -d "node_modules" ]; then
  echo "[2/3] Installing game dependencies (npm install)..."
  npm install
else
  echo "[2/3] Game dependencies verified."
fi

# Create Desktop launcher for Linux or macOS
if [ "$(uname)" = "Darwin" ] && [ -d "$HOME/Desktop" ]; then
  LAUNCHER="$HOME/Desktop/Play Khepri - Outriders of the Sun.command"
  cat > "$LAUNCHER" <<EOF
#!/usr/bin/env bash
cd "$GAME_DIR"
./install_game_mac_linux.sh
EOF
  chmod +x "$LAUNCHER"
  echo "[OK] Created macOS Desktop shortcut: $LAUNCHER"
elif [ -d "$HOME/Desktop" ]; then
  LAUNCHER="$HOME/Desktop/khepri-outriders.desktop"
  cat > "$LAUNCHER" <<EOF
[Desktop Entry]
Type=Application
Name=Khepri: Outriders of the Sun
Comment=100-Player Solar Battle Royale (Ride Out Heroes Reborn)
Exec=bash -c 'cd "$GAME_DIR" && ./install_game_mac_linux.sh'
Icon=$GAME_DIR/public/pwa-512x512.png
Terminal=true
Categories=Game;ActionGame;
EOF
  chmod +x "$LAUNCHER"
  echo "[OK] Created Linux Desktop shortcut: $LAUNCHER"
fi

echo "[3/3] Starting local server and opening http://localhost:3000 ..."
(
  sleep 3
  if command -v open >/dev/null 2>&1; then
    open "http://localhost:3000"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000"
  fi
) &

npm run dev
