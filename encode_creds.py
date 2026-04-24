import base64
import json
import os

try:
    with open('credentials.json', 'r') as f:
        json_content = json.load(f)
    
    # Ensure the JSON is compact for encoding (no extra whitespace/newlines)
    json_string = json.dumps(json_content, separators=(',', ':'))
    
    encoded_string = base64.b64encode(json_string.encode('utf-8')).decode('ascii')
    print(encoded_string)
except Exception as e:
    print(f"Error during encoding: {e}", file=os.sys.stderr)
    os.sys.exit(1)
