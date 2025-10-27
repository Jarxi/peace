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
    Generate a concise summary (under 30 words) of the search results.

    Args:
        openai_client: OpenAI client instance
        query: The user's search query
        intention_summary: Optional intention summary from the LLM
        products: List of product dictionaries with 'name' and other fields

    Returns:
        A concise summary string (under 30 words)
    """
    if not openai_client:
        # Fallback if OpenAI client not available
        return f"Found {len(products)} boots for: {query}"

    # Build context from products with more details
    product_details = []
    for p in products[:3]:
        name = p.get('name', '')
        badges = p.get('badges', [])
        product_details.append({
            'name': name,
            'features': badges[:2] if badges else []  # Get top 2 features
        })

    # Format product list with names
    product_names = [p['name'] for p in product_details if p['name']]
    product_list = ', '.join(product_names[:2]) if product_names else 'No products'  # Show top 2 names

    # Get key features from top products
    all_features = []
    for p in product_details:
        all_features.extend(p['features'])
    unique_features = list(set(all_features))[:3]  # Get top 3 unique features
    features_text = ', '.join(unique_features) if unique_features else ''

    # Create prompt for GPT-4o-mini
    prompt = f"""You're helping a customer find boots. Write a natural summary (maximum 30 words) that mentions specific product names.

Customer searched for: {query}
What they need: {intention_summary or 'work boots'}
Top products: {product_list}
Key features: {features_text or 'durable work boots'}

Write ONE sentence mentioning the actual product names (like "{product_names[0] if product_names else 'boots'}"). Be specific about products, not generic. Under 30 words."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a boot sales expert. Write product-focused summaries that mention specific boot model names. Never be generic - always reference actual product names like 'Cortez Brown' or 'Kensington Black'. Stay under 30 words. Be specific, not vague."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=80,
            temperature=0.7
        )

        summary = response.choices[0].message.content.strip()

        # Ensure it's under 30 words
        words = summary.split()
        if len(words) > 30:
            summary = ' '.join(words[:30])

        return summary

    except Exception as e:
        print(f"[ERROR] Failed to generate summary with OpenAI: {e}")
        # Fallback summary
        return f"Found {len(products)} boots for: {query}"
