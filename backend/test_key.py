import requests

key1 = "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"

def test_model(model_name):
    print(f"Testing model: {model_name}...")
    headers = {
        "Authorization": f"Bearer {key1}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ghostboard.ai",
        "X-Title": "GhostBoard AI"
    }
    data = {
        "model": model_name,
        "messages": [{"role": "user", "content": "Hello, write a 1-sentence welcome message."}]
    }
    try:
        resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        print(f"Response status code: {resp.status_code}")
        print(f"Response body: {resp.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")

test_model("google/gemini-2.5-flash")
test_model("openrouter/free")
