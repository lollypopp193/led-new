#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UTF-8 Sonderzeichen Reparatur-Script
Repariert kaputte deutsche Umlaute in HTML/JS-Dateien
"""
import os
import glob

# Mapping von kaputten zu korrekten Zeichen
REPLACEMENTS = {
    '├ñ': 'ä',
    '├╝': 'ü',
    '├Â': 'ö',
    '├ä': 'Ä',
    '├£': 'Ü',
    '├ľ': 'Ö',
    '├á': 'ß',
    '├│': 'ó',
    '├®': 'é',
    '├¼': 'ü',
    '├í': 'í',
    'Ã¤': 'ä',
    'Ã¼': 'ü',
    'Ã¶': 'ö',
    'Ã„': 'Ä',
    'ÃÃ': 'Ü',
    'Ã': 'Ö',
    'ÃŸ': 'ß',
}

def fix_file(filepath):
    """Repariert UTF-8 Encoding in einer Datei"""
    try:
        # Lese Datei
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Prüfe ob Änderungen nötig sind
        original = content
        for bad, good in REPLACEMENTS.items():
            content = content.replace(bad, good)
        
        # Nur schreiben wenn geändert
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"❌ Error in {filepath}: {e}")
        return False

def main():
    """Hauptfunktion"""
    base_dir = 'www'
    patterns = ['**/*.html', '**/*.js']
    
    fixed_count = 0
    for pattern in patterns:
        for filepath in glob.glob(os.path.join(base_dir, pattern), recursive=True):
            if fix_file(filepath):
                fixed_count += 1
    
    print(f"\n🎯 Fertig! {fixed_count} Dateien repariert.")

if __name__ == '__main__':
    main()
