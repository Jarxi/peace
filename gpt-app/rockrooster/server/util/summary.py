"""
Summary generation utility using OpenAI GPT-4o-mini
"""
from typing import List, Dict, Any, Optional
from openai import OpenAI


def generate_summary(
    openai_client: OpenAI,
    query: str,
    intention_summary: Optional[str],
    products: List[Dict[str, Any]]
) -> str:
    """
    Generate a concise summary (under 20 words) of the search results.

    Args:
        openai_client: OpenAI client instance
        query: The user's search query
        intention_summary: Optional intention summary from the LLM
        products: List of product dictionaries with 'name' and other fields

    Returns:
        A concise summary string (under 20 words)
    """
    if not openai_client:
        # Fallback if OpenAI client not available
        return f"Found {len(products)} boots for: {query}"

    # Build context from products
    product_names = [p.get('name', '') for p in products[:3]]
    product_list = ', '.join(product_names) if product_names else 'No products'

    # Create prompt for GPT-4o-mini
    prompt = f"""You're helping a customer find the perfect boots. Write a natural, conversational summary (maximum 20 words) that explains what boots we found for them.

Customer searched for: {query}
What they need: {intention_summary or 'work boots'}
We found: {len(products)} boots including {product_list}

Write a friendly, natural sentence explaining these products to the customer. Focus on how these boots match their needs. Keep it under 20 words."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a friendly boot expert helping customers find the perfect boots. Write natural, conversational summaries that warmly explain products to customers. Always stay under 20 words and focus on how the boots meet their needs."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=60,
            temperature=0.8
        )

        summary = response.choices[0].message.content.strip()

        # Ensure it's under 20 words
        words = summary.split()
        if len(words) > 20:
            summary = ' '.join(words[:20])

        return summary

    except Exception as e:
        print(f"[ERROR] Failed to generate summary with OpenAI: {e}")
        # Fallback summary
        return f"Found {len(products)} boots for: {query}"
