#!/bin/bash
# Automatische Synchronisation von www/ zu android/app/src/main/assets/public/
# Dieses Script muss nach JEDER Änderung an www/ ausgeführt werden!

echo "🔄 Synchronisiere www/ → android/app/src/main/assets/public/"
rsync -av --delete www/ android/app/src/main/assets/public/
echo "✅ Synchronisation abgeschlossen!"
echo ""
echo "📝 Vergiss nicht, die Änderungen zu committen:"
echo "   git add -A"
echo "   git commit -m 'Sync www to android assets'"
echo "   git push origin main"
