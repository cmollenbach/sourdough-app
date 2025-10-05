import os
import re

# Get the frontend src directory
frontend_src = r"C:\Sourdough-app\sourdough-app\frontend\src"

# Pattern to match imports from types directories
pattern = r"from\s+['\"]\.\.\/\.\.\/types\/[a-z]+['\"]"
replacement = "from '@sourdough/shared'"

count = 0
for root, dirs, files in os.walk(frontend_src):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = re.sub(pattern, replacement, content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f"Updated: {filepath}")

print(f"\nTotal files updated: {count}")
