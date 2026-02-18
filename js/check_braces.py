
filename = r"c:\Users\SUS\Documents\GitHub\DataGymAnalyse\js\video_processor.js"

with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()

open_braces = 0
stack = []

for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            open_braces += 1
            stack.append(i + 1)
        elif char == '}':
            open_braces -= 1
            if stack:
                stack.pop()
            else:
                print(f"Extra closing brace at line {i+1}")

print(f"Final open braces count: {open_braces}")
if open_braces > 0:
    print(f"Unclosed braces starting at lines: {stack[:5]} ...")
