"""
Script to generate and store embeddings for all products in the database.
This combines product title, description, and variant information into embeddings.
"""

import os
import sys
from typing import List, Dict, Any
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize clients
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


def create_product_text(product: Dict[str, Any], variants: List[Dict[str, Any]]) -> str:
    """
    Create a text representation of a product for embedding generation.
    Combines product title, description, geo_metadata, tags from metadata, and variant details.
    """
    parts = []

    # Add product title
    if product.get("title"):
        parts.append(product["title"])

    # Add product description
    if product.get("description"):
        parts.append(product["description"])

    # Add geo_metadata if present
    if product.get("geo_metadata"):
        parts.append(f"Geographic context: {product['geo_metadata']}")

    # Add tags from metadata if present
    metadata = product.get("metadata")
    if metadata and isinstance(metadata, dict):
        tags = metadata.get("tags")
        if tags and isinstance(tags, str) and tags.strip():
            # Tags are comma-separated, clean them up for embedding
            parts.append(f"Tags: {tags}")

    # Add variant information
    if variants:
        variant_texts = []
        for variant in variants:
            variant_parts = []

            if variant.get("title"):
                variant_parts.append(f"Variant: {variant['title']}")

            if variant.get("width"):
                variant_parts.append(f"Width: {variant['width']}")

            if variant.get("material"):
                variant_parts.append(f"Material: {variant['material']}")

            if variant_parts:
                variant_texts.append(" | ".join(variant_parts))

        if variant_texts:
            parts.append("Available options: " + "; ".join(variant_texts))

    return " - ".join(parts)


def generate_embedding(text: str) -> List[float]:
    """Generate embedding using OpenAI's text-embedding-3-small model."""
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
            encoding_format="float"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None


def fetch_products_with_variants() -> List[Dict[str, Any]]:
    """Fetch all products with their variants from Supabase."""
    try:
        # Fetch all products
        products_response = supabase.table("product").select("*").execute()
        products = products_response.data

        print(f"Found {len(products)} products")

        # For each product, fetch its variants
        for product in products:
            variants_response = supabase.table("product_variant").select("*").eq(
                "product_id", product["id"]
            ).execute()
            product["variants"] = variants_response.data

        return products
    except Exception as e:
        print(f"Error fetching products: {e}")
        return []


def update_product_embedding(product_id: str, embedding: List[float]) -> bool:
    """Update the product's embedding in the database."""
    try:
        supabase.table("product").update({
            "embedding": embedding
        }).eq("id", product_id).execute()
        return True
    except Exception as e:
        print(f"Error updating embedding for product {product_id}: {e}")
        return False


def main():
    """Main function to generate embeddings for all products."""
    print("Starting embedding generation process...")

    # Validate environment variables
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found in environment variables")
        sys.exit(1)

    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
        sys.exit(1)

    # Fetch all products with variants
    products = fetch_products_with_variants()

    if not products:
        print("No products found or error fetching products")
        return

    # Process each product
    success_count = 0
    error_count = 0

    for i, product in enumerate(products, 1):
        product_id = product["id"]
        product_title = product.get("title", "Unknown")

        print(f"\n[{i}/{len(products)}] Processing: {product_title} (ID: {product_id})")

        # Create text representation
        product_text = create_product_text(product, product.get("variants", []))
        print(f"  Text: {product_text[:100]}...")

        # Generate embedding
        embedding = generate_embedding(product_text)

        if embedding is None:
            print(f"  ❌ Failed to generate embedding")
            error_count += 1
            continue

        # Update database
        if update_product_embedding(product_id, embedding):
            print(f"  ✅ Successfully updated embedding")
            success_count += 1
        else:
            print(f"  ❌ Failed to update database")
            error_count += 1

    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total products: {len(products)}")
    print(f"Successfully processed: {success_count}")
    print(f"Errors: {error_count}")
    print("="*60)


if __name__ == "__main__":
    main()
