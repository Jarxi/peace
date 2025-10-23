#!/usr/bin/env python3
"""Fetch Shopify Admin snapshots and keep the latest versions."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import sys
import urllib.error
import urllib.request
import ssl
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse, urlunparse

API_VERSION = "2025-07"  # See https://shopify.dev/docs/api/usage/versioning
HISTORY_VERSION_RETENTION = 30
DEFAULT_PAGE_SIZE = 50
VARIANT_PAGE_SIZE = 50
VARIANT_FRAGMENT = """
fragment VariantFields on ProductVariant {
  id
  title
  price
  inventoryQuantity
  barcode
  sku
  selectedOptions { name value }
  inventoryItem {
    id
    tracked
    countryCodeOfOrigin
    harmonizedSystemCode
    measurement {
      weight {
        value
        unit
      }
    }
    inventoryLevels(first: 10) {
      edges {
        node {
          location {
            name
            address {
                zip
            }
          }
          quantities(names: "on_hand") { 
            name
            quantity
          }
        }
      }
    }
  }
}

"""
BASE_DIR = pathlib.Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_DIR = BASE_DIR / "data/shopify/raw-admin"
DEFAULT_CONFIG_PATH = BASE_DIR / "platforms/shopify/shops.json"
LOG_DIR = pathlib.Path("/tmp/integrations/product-feed/shopify/log")
LOG_LATEST = LOG_DIR / "admin-latest.log"
LOG_SINKS: list[pathlib.Path] = []
LOG_TO_STDOUT = False
LOG_RETENTION = 30

GRAPHQL_QUERY = VARIANT_FRAGMENT + """
query FetchAdmin($first: Int!, $after: String) {
  shop {
    id
    name
    myshopifyDomain
    contactEmail
    currencyCode
    primaryDomain {
      url
      host
    }
  }
  products(first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        id
        handle
        title
        description
        descriptionHtml
        vendor
        productType
        tags
        category {
          fullName
          id
        }
        featuredImage {
          url
          altText
        }
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
        collections(first: 10) {
          edges {
            node {
              id
              handle
              title
            }
          }
        }
        updatedAt
        totalInventory
        metafield(namespace: "custom", key: "material") {
          value
        }
        variants(first: 50) {
          edges {
            node {
              ...VariantFields
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }
}
"""

PRODUCT_VARIANTS_QUERY = VARIANT_FRAGMENT + """
query FetchProductVariants($id: ID!, $first: Int!, $after: String) {
  product(id: $id) {
    variants(first: $first, after: $after) {
      edges {
        node {
          ...VariantFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
"""









def prepare_logging(use_stdout: bool) -> None:
    """Configure log sinks for the current run."""
    global LOG_TO_STDOUT, LOG_SINKS
    LOG_TO_STDOUT = use_stdout
    LOG_SINKS.clear()
    if LOG_TO_STDOUT:
        return
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    run_stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    run_file = LOG_DIR / f"admin-{run_stamp}.log"
    run_file.touch(exist_ok=True)
    LOG_LATEST.write_text("", encoding="utf-8")
    LOG_SINKS.extend([run_file, LOG_LATEST])


class ShopifyError(RuntimeError):
    """Generic failure raised when Shopify rejects a request."""


def log(message: str) -> None:
    timestamp = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    line = f"{timestamp} {message}"
    if LOG_TO_STDOUT:
        print(line)
        return
    if not LOG_SINKS:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        default_target = LOG_DIR / "admin.log"
        default_target.touch(exist_ok=True)
        LOG_SINKS.append(default_target)
    for sink in LOG_SINKS:
        with sink.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")


def load_shops(config_path: pathlib.Path) -> list[dict]:
    with config_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    stores = payload.get("stores")
    if not stores:
        raise ShopifyError("shops.json must define at least one enabled store")
    enabled = [s for s in stores if s.get("enabled", True)]
    if not enabled:
        raise ShopifyError("shops.json must define at least one enabled store")
    for store in enabled:
        if not store.get("store_id") or not store.get("admin_token"):
            raise ShopifyError("Each store needs 'store_id' and 'admin_token'")
        if store.get("return_window_days") is None:
            raise ShopifyError(
                "Each enabled store needs 'return_window_days' (integer days)"
            )
        try:
            window_days = int(store["return_window_days"])
        except (TypeError, ValueError):
            raise ShopifyError(
                "Each enabled store needs 'return_window_days' as an integer"
            ) from None
        if window_days <= 0:
            raise ShopifyError(
                "Each enabled store needs 'return_window_days' greater than zero"
            )
        store["return_window_days"] = window_days
    return enabled


def build_request(
    store_id: str,
    token: str,
    variables: dict,
    query: str = GRAPHQL_QUERY,
) -> urllib.request.Request:
    url = f"https://{store_id}.myshopify.com/admin/api/{API_VERSION}/graphql.json"
    body = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
        "Accept": "application/json",
    }
    return urllib.request.Request(url=url, data=body, headers=headers, method="POST")


def execute_query(
    store_id: str,
    token: str,
    variables: dict,
    query: str = GRAPHQL_QUERY,
) -> dict:
    request = build_request(store_id, token, variables, query=query)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise ShopifyError(f"{store_id}: HTTP {exc.code} {detail[:200]}") from exc
    except urllib.error.URLError as exc:
        reason = exc.reason
        log(f"Request error: urllib.URLError reason={reason!r}")
        if isinstance(reason, ssl.SSLCertVerificationError) or "CERTIFICATE_VERIFY_FAILED" in str(reason):
            raise ShopifyError(f"{store_id}: TLS certificate validation failed. Verify your system certificate bundle.") from exc
        raise ShopifyError(f"{store_id}: {reason}") from exc

    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise ShopifyError(f"{store_id}: Shopify returned invalid JSON ({exc})") from exc

    errors = parsed.get("errors") or parsed.get("data", {}).get("errors")
    if errors:
        raise ShopifyError(f"{store_id}: GraphQL errors {errors}")
    return parsed


def fetch_admin(store_id: str, token: str, page_size: int) -> dict:
    cursor = None
    edges: list[dict] = []
    shop_info = None
    extensions = None
    last_cursor = None

    while True:
        variables = {"first": page_size, "after": cursor}
        parsed = execute_query(store_id, token, variables)
        data = parsed.get("data")
        if not isinstance(data, dict):
            raise ShopifyError(f"{store_id}: response missing 'data'")

        extensions = parsed.get("extensions") or extensions

        if shop_info is None:
            shop_info = data.get("shop")

        products = data.get("products") or {}
        batch_edges = products.get("edges") or []
        processed_edges: list[dict] = []

        for edge in batch_edges:
            if not isinstance(edge, dict):
                processed_edges.append(edge)
                continue

            node = edge.get("node")
            if not isinstance(node, dict):
                processed_edges.append(edge)
                continue

            product_id = node.get("id")
            variants = node.get("variants")
            if isinstance(variants, dict) and product_id:
                variant_edges = variants.get("edges") or []
                if not isinstance(variant_edges, list):
                    variant_edges = []

                page_info = variants.get("pageInfo") or {}
                if not isinstance(page_info, dict):
                    page_info = {}

                has_next = bool(page_info.get("hasNextPage"))
                end_cursor = page_info.get("endCursor")

                while has_next:
                    extra_edges, page_info = fetch_product_variants(
                        store_id,
                        token,
                        product_id,
                        end_cursor,
                        VARIANT_PAGE_SIZE,
                    )
                    if extra_edges:
                        variant_edges.extend(extra_edges)
                    if not extra_edges and page_info.get("endCursor") == end_cursor:
                        break
                    has_next = bool(page_info.get("hasNextPage"))
                    end_cursor = page_info.get("endCursor")

                variants["edges"] = variant_edges
                variants["pageInfo"] = {
                    "hasNextPage": False,
                    "endCursor": end_cursor,
                }

            processed_edges.append(edge)

        edges.extend(processed_edges)

        page_info = products.get("pageInfo") or {}
        if page_info.get("hasNextPage"):
            cursor = page_info.get("endCursor")
            if not cursor:
                raise ShopifyError(f"{store_id}: missing endCursor for next page")
        else:
            last_cursor = page_info.get("endCursor")
            break

    snapshot = {
        "data": {
            "shop": shop_info,
            "products": {
                "edges": edges,
                "pageInfo": {
                    "hasNextPage": False,
                    "endCursor": last_cursor,
                },
            },
        },
    }
    if extensions is not None:
        snapshot["extensions"] = extensions
    return snapshot


def fetch_shop_policies(store_id: str, token: str, preferred_domain: str | None = None) -> dict[str, str]:
    url = f"https://{store_id}.myshopify.com/admin/api/{API_VERSION}/policies.json"
    request = urllib.request.Request(
        url=url,
        headers={"Accept": "application/json", "X-Shopify-Access-Token": token},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise ShopifyError(f"{store_id}: HTTP {exc.code} {detail[:200]}") from exc
    except urllib.error.URLError as exc:
        reason = exc.reason
        raise ShopifyError(f"{store_id}: {reason}") from exc

    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise ShopifyError(f"{store_id}: Shopify returned invalid JSON ({exc})") from exc

    policies = parsed.get("policies")
    if policies is None:
        return {}
    if not isinstance(policies, list):
        raise ShopifyError(f"{store_id}: unexpected policies payload")

    urls: dict[str, str] = {}
    for policy in policies:
        if not isinstance(policy, dict):
            continue
        policy_type = policy.get("policy_type") or policy.get("title")
        url_value = policy.get("url")
        if not policy_type or not url_value:
            continue
        urls[str(policy_type)] = str(url_value)

    if preferred_domain:
        preferred = preferred_domain.strip()
        if preferred and not preferred.startswith("http"):
            preferred = "https://" + preferred
        try:
            preferred_parts = urlparse(preferred)
        except ValueError:
            preferred_parts = None
        if preferred_parts and preferred_parts.netloc:
            preferred_scheme = preferred_parts.scheme or "https"
            preferred_netloc = preferred_parts.netloc
            normalized: dict[str, str] = {}
            for key, policy_url in urls.items():
                try:
                    parsed = urlparse(policy_url)
                except ValueError:
                    normalized[key] = policy_url
                    continue
                path_component = parsed.path or "/"
                normalized[key] = urlunparse(
                    (preferred_scheme, preferred_netloc, path_component, "", "", "")
                )
            urls = normalized
    return urls


def fetch_product_variants(
    store_id: str,
    token: str,
    product_id: str,
    after: str | None,
    page_size: int,
) -> tuple[list[dict], dict]:
    variables = {"id": product_id, "first": page_size, "after": after}
    parsed = execute_query(store_id, token, variables, query=PRODUCT_VARIANTS_QUERY)

    data = parsed.get("data")
    if not isinstance(data, dict):
        raise ShopifyError(f"{store_id}: product variant response missing 'data'")

    product = data.get("product")
    if not isinstance(product, dict):
        raise ShopifyError(f"{store_id}: product variant response missing 'product'")

    variants = product.get("variants") or {}
    edges = variants.get("edges") or []
    page_info = variants.get("pageInfo") or {}

    if not isinstance(edges, list):
        edges = []
    if not isinstance(page_info, dict):
        page_info = {}

    return edges, page_info


def _format_money(amount: object, currency: str) -> str:
    try:
        value = Decimal(str(amount))
        quantized = value.quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        return f"{amount} {currency}"
    return f"{quantized} {currency}"


def fetch_shipping_rates(
    store_id: str,
    token: str,
    fallback_currency: str | None = None,
) -> list[str]:
    url = f"https://{store_id}.myshopify.com/admin/api/{API_VERSION}/shipping_zones.json"
    request = urllib.request.Request(
        url=url,
        headers={"Accept": "application/json", "X-Shopify-Access-Token": token},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise ShopifyError(f"{store_id}: HTTP {exc.code} {detail[:200]}") from exc
    except urllib.error.URLError as exc:
        reason = exc.reason
        raise ShopifyError(f"{store_id}: {reason}") from exc

    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise ShopifyError(f"{store_id}: Shopify returned invalid JSON ({exc})") from exc

    zones = parsed.get("shipping_zones")
    if zones is None:
        return []
    if not isinstance(zones, list):
        raise ShopifyError(f"{store_id}: unexpected shipping_zones payload")

    entries: list[str] = []
    seen: set[str] = set()

    def iter_rates(rate_iterable):
        for rate in rate_iterable:
            if not isinstance(rate, dict):
                continue
            name = rate.get("name") or rate.get("title")
            price = rate.get("price")
            currency = (
                rate.get("currency")
                or rate.get("currency_code")
                or fallback_currency
            )
            if name and price is not None and currency:
                yield name, price, currency

    for zone in zones:
        if not isinstance(zone, dict):
            continue
        countries = zone.get("countries") or []
        shipping_rates = list(iter_rates(zone.get("shipping_rates") or []))
        shipping_rates.extend(iter_rates(zone.get("price_based_shipping_rates") or []))
        shipping_rates.extend(iter_rates(zone.get("weight_based_shipping_rates") or []))

        if not shipping_rates:
            continue

        if not countries:
            countries = [{}]

        for rate_name, price_value, currency_code in shipping_rates:
            price_str = _format_money(price_value, currency_code)

            for country in countries:
                if not isinstance(country, dict):
                    continue
                country_code = country.get("code") or country.get("name") or "*"
                provinces = country.get("provinces") or []
                if provinces:
                    for province in provinces:
                        if not isinstance(province, dict):
                            continue
                        province_code = province.get("code") or province.get("name") or "*"
                        entry = f"{country_code}:{province_code}:{rate_name}:{price_str}"
                        if entry not in seen:
                            seen.add(entry)
                            entries.append(entry)
                else:
                    entry = f"{country_code}:*:{rate_name}:{price_str}"
                    if entry not in seen:
                        seen.add(entry)
                        entries.append(entry)

    return entries


def store_snapshot(base_dir: pathlib.Path, store_id: str, payload: dict, history_retention: int) -> pathlib.Path:
    store_dir = base_dir / store_id
    store_dir.mkdir(parents=True, exist_ok=True)
    timestamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    snapshot_path = store_dir / f"{timestamp}.json"
    with snapshot_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
    prune_snapshots(store_dir, history_retention)
    return snapshot_path


def prune_snapshots(store_dir: pathlib.Path, history_retention: int) -> None:
    snapshots = sorted(p for p in store_dir.glob("*.json") if p.is_file())
    for old_path in snapshots[:-history_retention]:
        old_path.unlink(missing_ok=True)


def prune_logs() -> None:
    if LOG_TO_STDOUT:
        return
    if not LOG_DIR.exists():
        return
    log_files = sorted(
        p for p in LOG_DIR.glob("admin-*.log")
        if p.is_file() and p.name != LOG_LATEST.name
    )
    for old_path in log_files[:-LOG_RETENTION]:
        old_path.unlink(missing_ok=True)


def run(config_path: pathlib.Path, output_dir: pathlib.Path, page_size: int, history_retention: int) -> None:
    stores = load_shops(config_path)
    log(f"Starting Admin API snapshot run for {len(stores)} store(s)")
    for store in stores:
        store_id = store["store_id"]
        token = store["admin_token"]
        log(f"Fetching Admin API data for {store_id}")
        try:
            snapshot = fetch_admin(store_id, token, page_size)
        except ShopifyError as exc:
            log(f"Failed {store_id}: {exc}")
            continue

        shop_info = snapshot.get("data", {}).get("shop") if isinstance(snapshot, dict) else None
        primary_domain_url = None
        primary_domain_host = None
        if isinstance(shop_info, dict):
            primary_domain = shop_info.get("primaryDomain")
            if isinstance(primary_domain, dict):
                primary_domain_url = primary_domain.get("url")
                primary_domain_host = primary_domain.get("host")
                if not primary_domain_url and primary_domain_host:
                    primary_domain_url = f"https://{primary_domain_host}"

        shop_section = snapshot.setdefault("data", {}).setdefault("shop", {})

        try:
            policies = fetch_shop_policies(store_id, token, primary_domain_url)
        except ShopifyError as exc:
            log(f"Policies unavailable for {store_id}: {exc}")
        else:
            shop_section["policyUrls"] = policies

        currency_code = None
        if isinstance(shop_info, dict):
            currency_code = shop_info.get("currencyCode")

        try:
            shipping_rates = fetch_shipping_rates(store_id, token, currency_code)
        except ShopifyError as exc:
            log(f"Shipping rates unavailable for {store_id}: {exc}")
        else:
            if shipping_rates:
                shop_section["shippingRates"] = shipping_rates

        return_window = store["return_window_days"]
        shop_section["returnWindowDays"] = return_window

        products_section = snapshot.get("data", {}).get("products")
        if isinstance(products_section, dict):
            edges = products_section.get("edges") or []
            for edge in edges:
                if not isinstance(edge, dict):
                    continue
                node = edge.get("node")
                if not isinstance(node, dict):
                    continue

                product_url = node.get("onlineStoreUrl") or node.get("productUrl")
                handle = node.get("handle")

                if not product_url:
                    base_url = primary_domain_url
                    if not base_url and primary_domain_host:
                        base_url = f"https://{primary_domain_host}"
                    if not base_url:
                        if store_id.endswith(".myshopify.com"):
                            base_url = f"https://{store_id}"
                        else:
                            base_url = f"https://{store_id}.myshopify.com"
                    if not handle:
                        continue
                    product_url = f"{base_url.rstrip('/')}/products/{handle}"

                node.setdefault("productUrl", product_url)

                variants_section = node.get("variants")
                if isinstance(variants_section, dict):
                    variant_edges = variants_section.get("edges") or []
                    if isinstance(variant_edges, list):
                        base_variant_url = product_url.split("?")[0]
                        for variant_edge in variant_edges:
                            if not isinstance(variant_edge, dict):
                                continue
                            variant_node = variant_edge.get("node")
                            if not isinstance(variant_node, dict):
                                continue
                            variant_id = variant_node.get("id")
                            if not variant_id:
                                continue
                            variant_identifier = str(variant_id).split("/")[-1]
                            variant_node["variantUrl"] = (
                                f"{base_variant_url}?variant={variant_identifier}"
                            )
        path = store_snapshot(output_dir, store_id, snapshot, history_retention)
        log(f"Saved {path}")
    log("Admin API snapshot run complete")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch Shopify Admin JSON snapshots")
    parser.add_argument("--config", default=DEFAULT_CONFIG_PATH, type=pathlib.Path, help="Path to shops.json secrets file")
    parser.add_argument("--output", default=DEFAULT_OUTPUT_DIR, type=pathlib.Path, help="Directory to store Shopify Admin API snapshots")
    parser.add_argument("--page-size", default=DEFAULT_PAGE_SIZE, type=int, help="Products per request page")
    parser.add_argument("--history-retention", default=HISTORY_VERSION_RETENTION, type=int, help="Snapshots to retain per store")
    parser.add_argument("--log-to-stdout", action="store_true", help="Print log lines instead of writing to /tmp/integrations/product-feed/shopify/log")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    prepare_logging(args.log_to_stdout)
    try:
        run(args.config, args.output, args.page_size, args.history_retention)
    except ShopifyError as exc:
        log(f"Run failed: {exc}")
        print(exc, file=sys.stderr)
        prune_logs()
        return 1
    prune_logs()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
