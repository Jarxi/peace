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
    Generate a concise summary (under 15 words) of the search results.

    Args:
        openai_client: OpenAI client instance
        query: The user's search query
        intention_summary: Optional intention summary from the LLM
        products: List of product dictionaries with 'name' and other fields

    Returns:
        A concise summary string (under 15 words)
    """
    if not openai_client:
        # Fallback if OpenAI client not available
        return f"Found {len(products)} boots for: {query}"

    # Get key features and descriptions from top products
    all_features = []
    descriptions = []
    for p in products[:3]:
        badges = p.get('badges', [])
        all_features.extend(badges[:2])
        desc = p.get('description', '')
        if desc:
            descriptions.append(desc[:100])  # First 100 chars of each description

    unique_features = list(set(all_features))[:3]  # Get top 3 unique features
    features_text = ', '.join(unique_features) if unique_features else 'quality work boots'

    # Combine descriptions for context
    combined_descriptions = ' '.join(descriptions[:2])  # Use first 2 descriptions

    # Create prompt for GPT-4o-mini
    prompt = f"""Write a direct summary (maximum 15 words) stating what makes these boots special.

Customer searched for: {query}
What they need: {intention_summary or 'work boots'}
Found {len(products)} boots with features: {features_text}
Product descriptions: {combined_descriptions[:200] if combined_descriptions else 'durable work boots'}

Be direct. State what's special about these results. NO filler words like "we found", "here are", "these are", "perfect for". Just the key differentiators. Under 15 words."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Write direct, no-nonsense boot summaries. Cut ALL filler words. State only what's special. Examples: 'Steel toe protection with waterproof leather for construction sites' NOT 'We found great boots with steel toe'. Be brutally concise. Under 15 words. No product names."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=40,
            temperature=0.6
        )

        summary = response.choices[0].message.content.strip()

        # Ensure it's under 15 words
        words = summary.split()
        if len(words) > 15:
            summary = ' '.join(words[:15])

        return summary

    except Exception as e:
        print(f"[ERROR] Failed to generate summary with OpenAI: {e}")
        # Fallback summary
        return f"Found {len(products)} boots for: {query}"
