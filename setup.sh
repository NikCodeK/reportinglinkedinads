#!/bin/bash

echo "🚀 LinkedIn Ads Dashboard Setup"
echo "==============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert. Bitte installieren Sie Node.js 18+ von https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js Version 18+ erforderlich. Aktuelle Version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) gefunden"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm ist nicht verfügbar"
    exit 1
fi

echo "✅ npm $(npm -v) gefunden"

# Install dependencies
echo "📦 Installiere Dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Fehler beim Installieren der Dependencies"
    exit 1
fi

echo "✅ Dependencies installiert"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Erstelle .env.local Datei..."
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Basic Auth
NEXT_PUBLIC_DASHBOARD_PASSWORD=admin123
EOF
    echo "✅ .env.local erstellt"
    echo "⚠️  Bitte konfigurieren Sie Ihre Supabase-Daten in .env.local"
else
    echo "✅ .env.local bereits vorhanden"
fi

echo ""
echo "🎉 Setup abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Konfigurieren Sie Supabase in .env.local (optional für MVP)"
echo "2. Starten Sie den Development Server:"
echo "   npm run dev"
echo ""
echo "🌐 Das Dashboard wird unter http://localhost:3000 verfügbar sein"
echo "🔑 Standard Passwort: admin123"
echo ""
echo "📖 Weitere Informationen finden Sie in der README.md"


