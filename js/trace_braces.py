
filename = r"c:\Users\SUS\Documents\GitHub\DataGymAnalyse\js\video_processor.js"

with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()

open_braces = 0
stack = []

for i, line in enumerate(lines):
    line_num = i + 1
    if line_num < 400 or line_num > 500:
        # Just track count
        for char in line:
            if char == '{':
                open_braces += 1
                stack.append(line_num)
            elif char == '}':
                open_braces -= 1
                if stack: stack.pop()
    else:
        # Print stack for region of interest
        for char in line:
            if char == '{':
                open_braces += 1
                stack.append(line_num)
                print(f"Line {line_num}: Open {{ -> Stack: {stack}")
            elif char == '}':
                open_braces -= 1
                if stack: stack.pop()
                print(f"Line {line_num}: Close }} -> Stack: {stack}")

print(f"Final Count: {open_braces}")
