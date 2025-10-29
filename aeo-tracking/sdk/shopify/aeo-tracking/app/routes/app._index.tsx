import { useEffect, useMemo, useRef, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { recordShopifyInstall } from "../utils/install-tracker.server";
import { ensurePixelExists } from "../utils/shopify-pixel.server";
import { fetchShopInfo } from "../utils/shopify-store-info.server";

import styles from "./app._index/styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const shopInfo = await fetchShopInfo(admin, session);
  if (!shopInfo) {
    console.warn("[home] Shop info unavailable; returning placeholder");
    return {
      claimCode: null,
    };
  }

  let claimCode: string | null = null;
  try {
    claimCode = await recordShopifyInstall(shopInfo);
  } catch (error) {
    console.error("[home] Failed to record shop install", error);
  }

  try {
    await ensurePixelExists(admin, shopInfo.id);
  } catch (error) {
    console.error("[home] Failed to ensure web pixel", error);
  }

  return {
    claimCode,
  };
};

export default function Index() {
  const { claimCode } = useLoaderData<typeof loader>();
  const integrationCode = claimCode ?? "";
  const [copied, setCopied] = useState(false);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = useMemo(
    () => [
      {
        title: "Copy your link code",
        text: "Copy your link code below.",
      },
      {
        title: "Open Shumbird.com",
        text: "Open Shunbird.com, register, and log in.",
      },
      {
        title: "Paste the code",
        text: "Paste the code when prompted—tracking starts immediately.",
      },
    ],
    [],
  );


  const integrationCodeDisplay = integrationCode || "Pending - please refresh the page";

  const handleCopy = async () => {
    if (!integrationCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(integrationCode);
      setCopied(true);
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyResetTimeoutRef.current = null;
      }, 1500);
    } catch (error) {
      console.error("[app._index] Failed to copy integration code", error);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
        copyResetTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <s-page>
      <div className={styles.pageShell}>
        <div className={styles.headerStrip}>
          <span className={styles.headerTag}>AEO tracking</span>
          <span className={styles.dividerDot} aria-hidden />
          <span className={styles.headerCopy}>Connect your store to Shumbird</span>
        </div>

        <section className={styles.heroCard} aria-label="Connect Shopify & track ChatGPT clicks">
          <header className={styles.heroHeader}>
            <div>
              <h1>ChatGPT AEO Tracker for Shopify Store</h1>
              <p>Real-time tracking how many shoppers coming from ChatGPT to your Shopify store (limited-time <strong>free</strong>).</p>
            </div>
          </header>

          <article className={styles.stepCard} aria-labelledby="how-it-works">
            <h3 className={styles.stepTitle} id="how-it-works">Instructions:</h3>
            <ol className={styles.stepCopy}>
              {steps.map((step, index) => (
                <li key={step.title}>{step.text}</li>
              ))}
            </ol>
            <p style={{opacity: 0.8}}>No additional installation or theme changes required.</p>
          </article>

          <div className={styles.codeContainer}>
            <label className={styles.codeLabel} htmlFor="integration-code">
              Use this during registration. Don't see a link code?{' '}
              <button className={styles.refreshLink} type="button" onClick={handleRefresh}>
                Refresh
              </button>
              .
            </label>
            <div className={styles.codeRow}>
              <div className={styles.codeBox}>
                <code id="integration-code" className={styles.codeText}>
                  {integrationCodeDisplay}
                </code>
              </div>
              <button
                className={styles.copyButton}
                type="button"
                onClick={handleCopy}
                disabled={!integrationCode}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <a
            className={styles.primaryCta}
            href="https://www.shumbird.com/login"
            target="_blank"
            rel="noreferrer"
          >
            Go to shumbird.com to activate
          </a>
          <div className={styles.heroCtaCaption}>
            No developer changes required.
          </div>
        </section>

        <section
          className={styles.screenshotSection}
          aria-label="Tracking dashboard preview"
        >
          <h2 className={styles.screenshotTitle}>See the Tracker Dashboard</h2>
          <p className={styles.screenshotCaption}>
            Monitor ChatGPT-driven sessions and conversions at a glance.
          </p>
          <div className={styles.screenshotFrame}>
            <img
              src="/images/demo.png"
              alt="Screenshot of the AEO tracking dashboard showing ChatGPT referral metrics"
              loading="lazy"
            />
          </div>
        </section>


        <section className={styles.helpStrip}>
          Need a hand?{' '}
          <a className={styles.helpLink} href="https://www.shumbird.com/contact">
            contact support
          </a>
          .
        </section>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
