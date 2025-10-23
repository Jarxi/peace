"""Minimal entry point for the Shopify product feed pipeline."""

from __future__ import annotations

import argparse
import json
import uuid
import os
import sys
from typing import Any
from urllib import error, request

from datetime import datetime, timezone

from dotenv import load_dotenv
from supabase import Client, create_client

API_VERSION = "2025-07"
DEFAULT_SUCCESS_VERSION_RETENTION = 10

SHOP_INFO_QUERY = """
query FetchShopInfo {
  shop {
    id
    name
    myshopifyDomain
    contactEmail
    url
    shopPolicies {
      id
      title
      type
      url
      body
    }
  }
}
"""

DELIVERY_PROFILES_QUERY = """
query DeliveryZoneList {
  deliveryProfiles(first: 10) {
    edges {
      node {
        id
        profileLocationGroups {
          locationGroup {
            id
          }
          locationGroupZones(first: 10) {
            edges {
              node {
                zone {
                  id
                  name
                  countries {
                    code {
                      countryCode
                      restOfWorld
                    }
                    provinces {
                      name
                      code
                    }
                  }
                }
                methodDefinitions(first: 10) {
                  edges {
                    node {
                      id
                      active
                      description
                      rateProvider {
                        __typename
                        ... on DeliveryRateDefinition {
                          price {
                            amount
                            currencyCode
                          }
                        }
                        ... on DeliveryParticipant {
                          fixedFee {
                            amount
                            currencyCode
                          }
                          percentageOfRateFee
                        }
                      }
                      methodConditions {
                        field
                        operator
                        conditionCriteria {
                          __typename
                          ... on MoneyV2 {
                            amount
                            currencyCode
                          }
                          ... on Weight {
                            unit
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
"""

PRODUCTS_QUERY = """
query FetchProducts($first: Int!, $after: String) {
  products(first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        id
        title
        handle
        productType
        tags
        description
        descriptionHtml
        featuredImage {
          id
          url
          altText
        }
        totalInventory
        images(first: 20) {
          edges {
            cursor
            node {
              id
              url
              altText
            }
          }
        }
      }
    }
  }
}
"""

PRODUCT_VARIANTS_QUERY = """
query FetchProductVariants($id: ID!, $first: Int!, $after: String) {
  product(id: $id) {
    variants(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          sku
          barcode
          price
          inventoryQuantity
          selectedOptions {
            name
            value
          }
          inventoryItem {
            id
            tracked
            measurement {
              weight {
                value
                unit
              }
            }
            inventoryLevels(first: 20) {
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
      }
    }
  }
}
"""


def fetch_shopify_stores(
    base_url: str,
    api_key: str,
    table: str,
) -> list[tuple[str, str, str]]:
    client: Client = create_client(base_url, api_key)
    response = (
        client.table(table)
        .select(
            "store_id, domain:store_info->>myshopifyDomain, access_token:store_info->>accessToken"
        )
        .neq("store_info->>myshopifyDomain", "")
        .eq("platform_id", "shopify")
        .is_("deletion_requested_at", None)
        .execute()
    )

    records = response.data or []
    mapping: list[tuple[str, str, str]] = []
    for record in records:
        if not isinstance(record, dict):
            continue
        store_id = record.get("store_id")
        domain = record.get("domain")
        access_token = record.get("access_token")
        if isinstance(store_id, str) and isinstance(domain, str) and domain.strip():
            token_value = access_token.strip() if isinstance(access_token, str) else ""
            mapping.append((store_id, domain.strip(), token_value))
    return mapping

def _shop_admin_graphql_url(domain: str) -> str:
    host = domain.strip()
    return f"https://{host}/admin/api/{API_VERSION}/graphql.json"


def fetch_shop_info(domain: str, token: str) -> dict[str, Any]:
    url = _shop_admin_graphql_url(domain)
    payload = json.dumps({'query': SHOP_INFO_QUERY, 'variables': {}}).encode('utf-8')
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Shopify-Access-Token': token,
    }
    request_obj = request.Request(url=url, data=payload, headers=headers, method='POST')
    try:
        with request.urlopen(request_obj, timeout=30) as response:
            body = response.read().decode('utf-8')
    except error.HTTPError as exc:
        detail = exc.read().decode('utf-8', errors='replace')
        raise RuntimeError(f"{domain}: HTTP {exc.code} {detail}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"{domain}: network error {exc.reason}") from exc

    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{domain}: invalid JSON response ({exc})") from exc

    data = payload.get('data')
    if not isinstance(data, dict):
        raise RuntimeError(f"{domain}: missing 'data' in response")
    shop = data.get('shop')
    if not isinstance(shop, dict):
        raise RuntimeError(f"{domain}: missing 'shop' in response")
    return shop


def fetch_delivery_profiles(domain: str, token: str) -> dict[str, Any]:
    url = _shop_admin_graphql_url(domain)
    payload = json.dumps({'query': DELIVERY_PROFILES_QUERY, 'variables': {}}).encode('utf-8')
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Shopify-Access-Token': token,
    }
    request_obj = request.Request(url=url, data=payload, headers=headers, method='POST')
    try:
        with request.urlopen(request_obj, timeout=30) as response:
            body = response.read().decode('utf-8')
    except error.HTTPError as exc:
        detail = exc.read().decode('utf-8', errors='replace')
        raise RuntimeError(f"{domain}: HTTP {exc.code} {detail}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"{domain}: network error {exc.reason}") from exc

    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{domain}: invalid JSON response ({exc})") from exc

    data = payload.get('data')
    if not isinstance(data, dict):
        raise RuntimeError(f"{domain}: missing 'data' in response")
    profiles = data.get('deliveryProfiles')
    if not isinstance(profiles, dict):
        raise RuntimeError(f"{domain}: missing 'deliveryProfiles' in response")
    return profiles


def fetch_product_variants(
    domain: str,
    token: str,
    product_id: str | None,
    page_size: int = 100,
) -> list[dict[str, Any]]:
    if not isinstance(product_id, str) or not product_id:
        return []

    url = _shop_admin_graphql_url(domain)
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Shopify-Access-Token": token,
    }
    variants: list[dict[str, Any]] = []
    cursor: str | None = None

    while True:
        variables: dict[str, Any] = {"id": product_id, "first": page_size}
        if cursor:
            variables["after"] = cursor

        payload = json.dumps({"query": PRODUCT_VARIANTS_QUERY, "variables": variables}).encode("utf-8")
        request_obj = request.Request(url=url, data=payload, headers=headers, method="POST")
        try:
            with request.urlopen(request_obj, timeout=30) as response:
                body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"{domain}: HTTP {exc.code} {detail}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"{domain}: network error {exc.reason}") from exc

        try:
            payload = json.loads(body)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"{domain}: invalid JSON response ({exc})") from exc

        errors = payload.get("errors")
        if errors:
            raise RuntimeError(f"{domain}: GraphQL errors {errors}")

        data = payload.get("data")
        if not isinstance(data, dict):
            raise RuntimeError(f"{domain}: missing 'data' in variants response")

        product = data.get("product")
        if not isinstance(product, dict):
            raise RuntimeError(f"{domain}: missing 'product' in variants response")

        variants_payload = product.get("variants")
        if not isinstance(variants_payload, dict):
            raise RuntimeError(f"{domain}: missing 'variants' in response")

        edges = variants_payload.get("edges")
        if not isinstance(edges, list):
            raise RuntimeError(f"{domain}: missing variant 'edges' in response")

        for edge in edges:
            if not isinstance(edge, dict):
                continue
            node = edge.get("node")
            if not isinstance(node, dict):
                continue

            price_value = node.get("price")
            price_str = str(price_value) if price_value is not None else None

            selected_options = []
            options_payload = node.get("selectedOptions")
            if isinstance(options_payload, list):
                for option in options_payload:
                    if isinstance(option, dict):
                        selected_options.append(
                            {
                                "name": option.get("name"),
                                "value": option.get("value"),
                            }
                        )

            inventory_item_payload = node.get("inventoryItem")
            inventory_item: dict[str, Any] | None = None
            if isinstance(inventory_item_payload, dict):
                measurement_payload = inventory_item_payload.get("measurement") or {}
                weight_payload = None
                if isinstance(measurement_payload, dict):
                    weight_payload = measurement_payload.get("weight")
                weight = None
                if isinstance(weight_payload, dict):
                    weight = {
                        "value": weight_payload.get("value"),
                        "unit": weight_payload.get("unit"),
                    }

                inventory_levels_payload = inventory_item_payload.get("inventoryLevels")
                inventory_levels: list[dict[str, Any]] = []
                if isinstance(inventory_levels_payload, dict):
                    level_edges = inventory_levels_payload.get("edges")
                    if isinstance(level_edges, list):
                        for level_edge in level_edges:
                            if not isinstance(level_edge, dict):
                                continue
                            level_node = level_edge.get("node")
                            if not isinstance(level_node, dict):
                                continue
                            location_payload = level_node.get("location")
                            location: dict[str, Any] | None = None
                            if isinstance(location_payload, dict):
                                address_payload = location_payload.get("address")
                                address = None
                                if isinstance(address_payload, dict):
                                    address = {
                                        "address1": address_payload.get("address1"),
                                        "address2": address_payload.get("address2"),
                                        "city": address_payload.get("city"),
                                        "provinceCode": address_payload.get("provinceCode"),
                                        "countryCode": address_payload.get("countryCode"),
                                        "zip": address_payload.get("zip"),
                                    }
                                location = {
                                    "name": location_payload.get("name"),
                                    "address": address,
                                }

                            quantities_payload = level_node.get("quantities")
                            quantities: list[dict[str, Any]] = []
                            if isinstance(quantities_payload, list):
                                for quantity in quantities_payload:
                                    if isinstance(quantity, dict):
                                        quantities.append(
                                            {
                                                "name": quantity.get("name"),
                                                "quantity": quantity.get("quantity"),
                                            }
                                        )

                            inventory_levels.append(
                                {
                                    "location": location,
                                    "quantities": quantities,
                                }
                            )

                inventory_item = {
                    "id": inventory_item_payload.get("id"),
                    "tracked": inventory_item_payload.get("tracked"),
                    "measurement": {"weight": weight} if weight is not None else None,
                    "inventoryLevels": inventory_levels,
                }

            variants.append(
                {
                    "id": node.get("id"),
                    "price": price_str,
                    "title": node.get("title"),
                    "sku": node.get("sku"),
                    "barcode": node.get("barcode"),
                    "inventoryQuantity": node.get("inventoryQuantity"),
                    "selectedOptions": selected_options,
                    "inventoryItem": inventory_item,
                }
            )

        page_info = variants_payload.get("pageInfo")
        if not isinstance(page_info, dict):
            raise RuntimeError(f"{domain}: missing variant 'pageInfo' in response")

        has_next_page = bool(page_info.get("hasNextPage"))
        cursor_value = page_info.get("endCursor")

        if not has_next_page:
            break

        if not isinstance(cursor_value, str) or not cursor_value:
            raise RuntimeError(f"{domain}: missing 'endCursor' for next page of variants")

        cursor = cursor_value

    return variants


def fetch_all_products(
    domain: str,
    token: str,
    page_size: int = 100,
) -> list[dict[str, Any]]:
    url = _shop_admin_graphql_url(domain)
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Shopify-Access-Token": token,
    }
    simplified_products: list[dict[str, Any]] = []
    cursor: str | None = None

    while True:
        variables: dict[str, Any] = {"first": page_size}
        if cursor:
            variables["after"] = cursor
        payload = json.dumps({"query": PRODUCTS_QUERY, "variables": variables}).encode("utf-8")
        request_obj = request.Request(url=url, data=payload, headers=headers, method="POST")
        try:
            with request.urlopen(request_obj, timeout=30) as response:
                body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"{domain}: HTTP {exc.code} {detail}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"{domain}: network error {exc.reason}") from exc

        try:
            payload = json.loads(body)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"{domain}: invalid JSON response ({exc})") from exc

        errors = payload.get("errors")
        if errors:
            raise RuntimeError(f"{domain}: GraphQL errors {errors}")

        data = payload.get("data")
        if not isinstance(data, dict):
            raise RuntimeError(f"{domain}: missing 'data' in response")

        products = data.get("products")
        if not isinstance(products, dict):
            raise RuntimeError(f"{domain}: missing 'products' in response")

        edges = products.get("edges")
        if not isinstance(edges, list):
            raise RuntimeError(f"{domain}: missing 'edges' in products response")

        for edge in edges:
            if not isinstance(edge, dict):
                continue
            node = edge.get("node")
            if not isinstance(node, dict):
                continue

            images_payload = node.get("images")
            image_nodes: list[dict[str, Any]] = []
            if isinstance(images_payload, dict):
                image_edges = images_payload.get("edges")
                if isinstance(image_edges, list):
                    for image_edge in image_edges:
                        if not isinstance(image_edge, dict):
                            continue
                        image_node = image_edge.get("node")
                        if isinstance(image_node, dict):
                            image_nodes.append(image_node)

            simplified_products.append(
                {
                    "id": node.get("id"),
                    "title": node.get("title"),
                    "handle": node.get("handle"),
                    "description": node.get("description"),
                    "descriptionHtml": node.get("descriptionHtml"),
                    "productType": node.get("productType"),
                    "tags": node.get("tags"),
                    "featuredImage": node.get("featuredImage"),
                    "images": image_nodes,
                    "totalInventory": node.get("totalInventory"),
                    "variants": fetch_product_variants(domain, token, node.get("id")),
                }
            )

        page_info = products.get("pageInfo")
        if not isinstance(page_info, dict):
            raise RuntimeError(f"{domain}: missing 'pageInfo' in products response")

        has_next_page = bool(page_info.get("hasNextPage"))
        cursor_value = page_info.get("endCursor")
        if not has_next_page:
            break

        if not isinstance(cursor_value, str) or not cursor_value:
            raise RuntimeError(f"{domain}: missing 'endCursor' for next page of products")

        cursor = cursor_value

    return simplified_products
def insert_load_state(
    load_state_client: Client,
    store_id: str,
    state: str,
    runtime_log: str,
    version_id: str,
    version_time: datetime,
    metrics: dict[str, Any] | None = None,
) -> None:
    payload = {
        "store_id": store_id,
        "version_id": version_id,
        "version_time": version_time.isoformat(),
        "runtime_log": runtime_log,
        "state": state,
    }
    if metrics is not None:
        payload["metrics"] = metrics

    try:
        load_state_client.schema("feed_shopify").table("load_state").insert(payload).execute()
    except Exception as exc:  # noqa: BLE001
        print(f"failed to write load_state for {store_id}: {exc}", file=sys.stderr)


def write_shop_info(
    load_state_client: Client,
    store_id: str,
    shop_info: dict[str, Any],
    version_id: str,
    version_time: datetime,
) -> None:
    try:
        load_state_client.schema("feed_shopify").table("shop_info").insert(
            {
                "store_id": store_id,
                "version_id": version_id,
                "created_at": version_time.isoformat(),
                "shop_info": shop_info,
            }
        ).execute()
    except Exception as exc:  # noqa: BLE001
        print(f"failed to write shop_info for {store_id}: {exc}", file=sys.stderr)


def write_acp_export(
    load_state_client: Client,
    store_id: str,
    shop_info: dict[str, Any],
    products: list[dict[str, Any]] | None,
    version_time: datetime,
) -> None:
    payload: dict[str, Any] = {
        "store_id": store_id,
        "shop_info": shop_info,
        "products": products if products is not None else [],
        "updated_at": version_time.isoformat(),
    }

    try:
        (
            load_state_client.schema("feed_shopify")
            .table("acp_export")
            .upsert(payload)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        print(f"failed to write acp_export for {store_id}: {exc}", file=sys.stderr)


def write_product_info(
    load_state_client: Client,
    store_id: str,
    version_id: str,
    products: list[dict[str, Any]] | None,
    chunk_size: int = 50,
) -> None:
    if not products:
        return

    rows: list[dict[str, Any]] = []
    for product in products:
        if not isinstance(product, dict):
            continue
        product_id = product.get("id")
        if not isinstance(product_id, str) or not product_id:
            continue
        product_payload = {key: value for key, value in product.items() if key != "variants"}
        rows.append(
            {
                "store_id": store_id,
                "product_id": product_id,
                "version_id": version_id,
                "product_info": product_payload,
            }
        )

    if not rows:
        return

    try:
        for idx in range(0, len(rows), chunk_size):
            batch = rows[idx : idx + chunk_size]
            (
                load_state_client.schema("feed_shopify")
                .table("product_info")
                .insert(batch)
                .execute()
            )
    except Exception as exc:  # noqa: BLE001
        print(f"failed to write product_info for {store_id}: {exc}", file=sys.stderr)


def write_product_variants(
    load_state_client: Client,
    store_id: str,
    version_id: str,
    products: list[dict[str, Any]] | None,
    chunk_size: int = 50,
) -> None:
    if not products:
        return

    rows: list[dict[str, Any]] = []
    for product in products:
        if not isinstance(product, dict):
            continue
        product_id = product.get("id")
        variants = product.get("variants")
        if not isinstance(product_id, str) or not product_id or not isinstance(variants, list):
            continue
        for variant in variants:
            if not isinstance(variant, dict):
                continue
            variant_id = variant.get("id")
            if not isinstance(variant_id, str) or not variant_id:
                continue
            rows.append(
                {
                    "store_id": store_id,
                    "product_id": product_id,
                    "variant_id": variant_id,
                    "version_id": version_id,
                    "variant_info": variant,
                }
            )

    if not rows:
        return

    try:
        for idx in range(0, len(rows), chunk_size):
            batch = rows[idx : idx + chunk_size]
            (
                load_state_client.schema("feed_shopify")
                .table("product_variant_info")
                .insert(batch)
                .execute()
            )
    except Exception as exc:  # noqa: BLE001
        print(f"failed to write product_variant_info for {store_id}: {exc}", file=sys.stderr)


def cleanup_old_versions(
    load_state_client: Client,
    store_id: str,
    retention: int,
) -> None:
    if retention <= 0:
        return

    def _delete_versions(table: str, version_batch: list[str]) -> None:
        try:
            (
                load_state_client.schema("feed_shopify")
                .table(table)
                .delete()
                .eq("store_id", store_id)
                .in_("version_id", version_batch)
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            print(f"failed to prune {table} for {store_id}: {exc}", file=sys.stderr)

    try:
        response = (
            load_state_client.schema("feed_shopify")
            .table("load_state")
            .select("version_id")
            .eq("store_id", store_id)
            .eq("state", "success")
            .order("version_time", desc=True)
            .range(0, retention - 1)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        print(f"failed to fetch load_state for cleanup ({store_id}): {exc}", file=sys.stderr)
        return

    keep_ids = {
        row.get("version_id")
        for row in (response.data or [])
        if isinstance(row, dict) and isinstance(row.get("version_id"), str)
    }

    if not keep_ids:
        return

    def _prune_table(table: str) -> None:
        try:
            response = (
                load_state_client.schema("feed_shopify")
                .table(table)
                .select("version_id")
                .eq("store_id", store_id)
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            print(f"failed to list {table} for cleanup ({store_id}): {exc}", file=sys.stderr)
            return

        candidate_ids = [
            row.get("version_id")
            for row in (response.data or [])
            if isinstance(row, dict)
            and isinstance(row.get("version_id"), str)
            and row.get("version_id") not in keep_ids
        ]
        if not candidate_ids:
            return

        for idx in range(0, len(candidate_ids), 50):
            batch = candidate_ids[idx : idx + 50]
            _delete_versions(table, batch)

    _prune_table("shop_info")
    _prune_table("product_info")
    _prune_table("product_variant_info")


def fetch_and_update(
    stores: list[tuple[str, str, str]],
    supabase_url: str,
    supabase_key: str,
):
    version_id = str(uuid.uuid4())
    version_time = datetime.now(timezone.utc)
    load_state_client = create_client(supabase_url, supabase_key)
    retention_env = os.getenv("SHOPIFY_SUCCESS_VERSION_RETENTION")
    try:
        success_retention = int(retention_env) if retention_env is not None else DEFAULT_SUCCESS_VERSION_RETENTION
    except ValueError:
        success_retention = DEFAULT_SUCCESS_VERSION_RETENTION

    for store_id, domain, access_token in stores:
        # step 1: get shopify access token
        runtime_log = ""
        shop_info = []
        products: list[dict[str, Any]] | None = None
        token_value = access_token.strip() if isinstance(access_token, str) else ""

        if store_id == "rockrooster":
            override_token = os.getenv("ROCKROOSTER_SHOPIFY_ACCESS_TOKEN", "").strip()
            if override_token:
                token_value = override_token
            elif not token_value:
                runtime_log = "missing ROCKROOSTER_SHOPIFY_ACCESS_TOKEN"
        elif not token_value:
            runtime_log = "missing Shopify access token"
        if runtime_log:
            insert_load_state(
                load_state_client,
                store_id,
                "failed",
                runtime_log,
                version_id,
                version_time,
            )
            continue
        # step 2: get shop info
        try: 
            shop_info = fetch_shop_info(domain, token_value)
        except Exception as exc:
            runtime_log = str(exc)
            insert_load_state(
                load_state_client,
                store_id,
                "failed",
                runtime_log,
                version_id,
                version_time,
            )
            continue

        # # step 3: get delivery profiles
        # TODO: disalbe it until the shipping policy is more clear
        # try:
        #     delivery_profiles = fetch_delivery_profiles(domain, token)
        # except Exception as exc:
        #     runtime_log = str(exc)
        #     insert_load_state(
        #         load_state_client,
        #         store_id,
        #         "failed",
        #         runtime_log,
        #         version_id,
        #         version_time,
        #     )
        #     continue
        # if isinstance(shop_info, dict):
        #     print(delivery_profiles)
        #     # shop_info["delivery_profiles"] = delivery_profiles

        # step 4: get all products
        try:
            products = fetch_all_products(domain, token_value)
        except Exception as exc:
            runtime_log = str(exc)
            insert_load_state(
                load_state_client,
                store_id,
                "failed",
                runtime_log,
                version_id,
                version_time,
            )
            continue

        write_shop_info(
            load_state_client,
            store_id,
            shop_info,
            version_id,
            version_time,
        )

        write_product_info(
            load_state_client,
            store_id,
            version_id,
            products,
        )

        write_product_variants(
            load_state_client,
            store_id,
            version_id,
            products,
        )

        write_acp_export(
            load_state_client,
            store_id,
            shop_info,
            products,
            version_time,
        )

        cleanup_old_versions(
            load_state_client,
            store_id,
            success_retention,
        )

        # write success state
        product_count = len(products) if products else 0
        variant_count = 0
        if products:
            for product in products:
                variants = product.get("variants") if isinstance(product, dict) else None
                if isinstance(variants, list):
                    variant_count += sum(1 for variant in variants if isinstance(variant, dict))
        insert_load_state(
            load_state_client,
            store_id,
            "success",
            runtime_log,
            version_id,
            version_time,
            metrics={"product_cnt": product_count, "variant_cnt": variant_count},
        )

def main(argv: list[str] | None = None) -> dict[str, Any] | int:
    load_dotenv()
    parser = argparse.ArgumentParser(description="Shopify pipeline placeholder.")
    parser.add_argument(
        "--supabase-url",
        default=os.getenv("SUPABASE_URL"),
        help="Supabase project URL (e.g., https://xyz.supabase.co).",
    )
    parser.add_argument(
        "--supabase-key",
        default=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        help="Supabase API key used for REST requests.",
    )
    parser.add_argument(
        "--supabase-table",
        default=os.getenv("SUPABASE_VENDOR_TABLE", "vendor_store_claim_state"),
        help="Supabase table containing vendor store claim state.",
    )
    args = parser.parse_args(argv)

    if not args.supabase_url or not args.supabase_key:
        print("Supabase configuration is required (SUPABASE_URL and key).", file=sys.stderr)
        return 1

    try:
        stores = fetch_shopify_stores(
            base_url=args.supabase_url,
            api_key=args.supabase_key,
            table=args.supabase_table,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"Supabase fetch failed: {exc}", file=sys.stderr)
        return 1
    
    if not stores:
        print("No Shopify stores returned from Supabase.", file=sys.stderr)
        return 1

    rock_token = os.getenv("ROCKROOSTER_SHOPIFY_ACCESS_TOKEN", "").strip()
    stores.append(("rockrooster", "rock-rooster-footwear-inc.myshopify.com", rock_token))

    return fetch_and_update(
        stores,
        args.supabase_url,
        args.supabase_key,
    )


if __name__ == "__main__":
    result = main()
    if isinstance(result, int):
        raise SystemExit(result)
    raise SystemExit(0)
