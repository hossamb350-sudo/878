
import json
import os

file_path = 'src/data/importedQuranData.json'

def check_json():
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    print(f"File size: {len(content)} characters")
    
    # Check for unescaped double quotes
    invalid_found = False
    for i in range(len(content)):
        char = content[i]
        if char == '"':
            # Check if it is escaped
            is_escaped = False
            j = i - 1
            while j >= 0 and content[j] == '\\':
                is_escaped = not is_escaped
                j -= 1
            
            if not is_escaped:
                # This is a string delimiter or a syntax error
                # For simplicity, we just look for double quotes in the middle of a string-like area
                if i >= 1112920 and i <= 1112940:
                    print(f"Double quote at {i}: {repr(content[i-15:i+15])}")
                    invalid_found = True
    
    if not invalid_found:
        print("No invalid backslashes found.")

    try:
        json.loads(content)
        print("JSON is valid according to python json.loads")
    except json.JSONDecodeError as e:
        print(f"JSON is INVALID: {e}")

check_json()
