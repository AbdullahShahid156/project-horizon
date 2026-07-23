import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API key found: {bool(api_key)} (len={len(api_key) if api_key else 0})")


async def main():
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    print("\n--- Test 1: gemini-2.5-flash-image with image generation ---")
    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash-image",
            contents="A red cat sitting on a blue cushion",
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        print(f"Response candidates: {len(response.candidates) if response.candidates else 0}")
        if response.candidates:
            candidate = response.candidates[0]
            print(f"Content parts: {len(candidate.content.parts) if candidate.content else 0}")
            for i, part in enumerate(candidate.content.parts):
                if part.inline_data is not None:
                    print(f"  Part {i}: inline_data, mime_type={part.inline_data.mime_type}, data_len={len(part.inline_data.data) if part.inline_data.data else 0}")
                elif part.text is not None:
                    print(f"  Part {i}: text = {part.text[:200]}")
                else:
                    print(f"  Part {i}: (empty/unknown)")
        else:
            print("No candidates in response")
            print(f"Full response: {response}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

    print("\n--- Test 2: gemini-2.0-flash with image generation (should fail) ---")
    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents="A red cat",
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        print(f"Response: {response}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

    print("\n--- Test 3: gemini-2.5-flash (no -image suffix) with image generation ---")
    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents="A red cat",
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        print(f"Response candidates: {len(response.candidates) if response.candidates else 0}")
        if response.candidates:
            for i, part in enumerate(response.candidates[0].content.parts):
                if part.inline_data is not None:
                    print(f"  Part {i}: inline_data, mime_type={part.inline_data.mime_type}, data_len={len(part.inline_data.data) if part.inline_data.data else 0}")
                elif part.text is not None:
                    print(f"  Part {i}: text = {part.text[:200]}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")


if __name__ == "__main__":
    asyncio.run(main())
