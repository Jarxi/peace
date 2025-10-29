import { useEffect, useMemo, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function Landing() {
  const { showForm } = useLoaderData<typeof loader>();
  const screenshots = useMemo(
    () => [
      {
        src: "/images/dashboard_recent_activity.png",
        alt: "Screenshot of recent activity metrics in the Shumbird tracker dashboard",
      },
      {
        src: "/images/dashboard_source.png",
        alt: "Screenshot showing traffic source breakdown in the Shumbird tracker dashboard",
      },
      {
        src: "/images/dashboard_trending.png",
        alt: "Screenshot of trending products driven by ChatGPT referrals",
      },
    ],
    [],
  );
  const [activeScreenshot, setActiveScreenshot] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreenshot((prev) => (prev + 1) % screenshots.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [screenshots.length]);

  const layoutStyles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4rem 1.5rem",
      background: "#f3f3f3",
    },
    shell: {
      width: "100%",
      maxWidth: "960px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "2.5rem",
      background: "#ffffff",
      borderRadius: "24px",
      padding: "3rem",
      boxShadow: "0 32px 64px rgba(13, 13, 13, 0.06)",
      border: "1px solid rgba(13, 13, 13, 0.12)",
    },
    pitch: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1.5rem",
    },
    brandRow: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.65rem",
    },
    logoImg: {
      height: "56px",
      width: "auto",
      display: "block",
    },
    tag: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      color: "#e25507",
      background: "rgba(255, 158, 108, 0.2)",
      borderRadius: "999px",
      padding: "0.45rem 0.85rem",
    },
    title: {
      fontSize: "2.25rem",
      lineHeight: 1.2,
      color: "#0d0d0d",
      margin: 0,
    },
    lede: {
      fontSize: "1.05rem",
      lineHeight: 1.6,
      color: "#5d5d5d",
      margin: 0,
    },
    highlights: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "grid",
      gap: "0.9rem",
      color: "#5d5d5d",
    },
    highlightItem: {
      paddingLeft: "1.75rem",
      position: "relative" as const,
    },
    highlightBullet: {
      content: '""',
      position: "absolute" as const,
      left: 0,
      top: "0.45rem",
      width: "0.65rem",
      height: "0.65rem",
      borderRadius: "0.2rem",
      background: "#e25507",
      boxShadow: "0 0 0 3px rgba(226, 85, 7, 0.18)",
    },
    form: {
      marginTop: "0.5rem",
      display: "grid",
      gap: "0.85rem",
      alignContent: "flex-start",
    },
    label: {
      display: "grid",
      gap: "0.35rem",
      fontSize: "0.95rem",
      color: "#0d0d0d",
    },
    input: {
      borderRadius: "0.75rem",
      border: "1px solid rgba(13, 13, 13, 0.12)",
      padding: "0.75rem 1rem",
      fontSize: "0.95rem",
      transition: "border-color 0.2s, box-shadow 0.2s",
    },
    cta: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.35rem",
      padding: "0.9rem 1.4rem",
      border: "none",
      borderRadius: "0.75rem",
      fontSize: "0.95rem",
      fontWeight: 600,
      color: "#ffffff",
      background: "#e25507",
      cursor: "pointer",
      boxShadow: "0 12px 24px rgba(226, 85, 7, 0.18)",
    },
    linkRow: {
      fontSize: "0.9rem",
      color: "#0285ff",
    },
    preview: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1rem",
      alignItems: "center",
      justifyContent: "center",
    },
    frame: {
      width: "100%",
      borderRadius: "20px",
      overflow: "hidden",
      border: "1px solid rgba(13, 13, 13, 0.12)",
      background: "#ffffff",
      position: "relative" as const,
      minHeight: "320px",
    },
    caption: {
      fontSize: "0.9rem",
      color: "#5d5d5d",
      textAlign: "center" as const,
      margin: 0,
    },
    screenshotImage: {
      position: "absolute" as const,
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "contain" as const,
      background: "#ffffff",
      opacity: 0,
      transition: "opacity 0.6s ease",
    },
    screenshotImageActive: {
      opacity: 1,
    },
    dots: {
      display: "flex",
      justifyContent: "center",
      gap: "0.5rem",
      marginTop: "1rem",
    },
    dot: {
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      background: "rgba(13, 13, 13, 0.12)",
      display: "inline-block",
    },
    dotActive: {
      background: "#e25507",
    },
  };

  return (
    <main style={layoutStyles.page}>
      <div style={layoutStyles.shell}>
        <section style={layoutStyles.pitch} aria-label="AEO tracking overview">
          <div style={layoutStyles.brandRow}>
            <img
              src="/images/logo.png"
              alt="Shumbird logo"
              style={layoutStyles.logoImg}
            />
            <span style={layoutStyles.tag}>Shumbird AEO tracking</span>
          </div>
          <h1 style={layoutStyles.title}>ChatGPT Attribution for Shopify Stores</h1>
          <p style={layoutStyles.lede}>
            See how many shoppers arrive from ChatGPT, what they do once they land, and how much revenue it creates—no code or theme edits required.
          </p>

          <ul style={layoutStyles.highlights}>
            <li style={layoutStyles.highlightItem}>
              <span style={layoutStyles.highlightBullet} aria-hidden />
              <strong>Simple setup.</strong> Install the app—no developer, no code, and we do the rest automatically.
            </li>
            <li style={layoutStyles.highlightItem}>
              <span style={layoutStyles.highlightBullet} aria-hidden />
              <strong>Live insights.</strong> Watch visits, carts, and orders from ChatGPT update in real time.
            </li>
          </ul>

          {showForm && (
            <Form style={layoutStyles.form} method="post" action="/auth/login">
              <label style={layoutStyles.label}>
                <span>Shop domain</span>
                <input
                  style={layoutStyles.input}
                  type="text"
                  name="shop"
                  placeholder="example.myshopify.com"
                  autoComplete="on"
                />
              </label>
              <button style={layoutStyles.cta} type="submit">
                Log in with Shopify
              </button>
            </Form>
          )}

          <div style={layoutStyles.linkRow}>
            <a href="https://shumbird.com" target="_blank" rel="noreferrer">
              Learn more at shumbird.com
            </a>
          </div>
        </section>

        <aside style={layoutStyles.preview} aria-label="Product preview">
          <div style={layoutStyles.frame}>
            {screenshots.map((shot, index) => (
              <img
                key={shot.src}
                src={shot.src}
                alt={shot.alt}
                loading={index === 0 ? "eager" : "lazy"}
                aria-hidden={index === activeScreenshot ? "false" : "true"}
                role="presentation"
                style={{
                  ...layoutStyles.screenshotImage,
                  ...(index === activeScreenshot
                    ? layoutStyles.screenshotImageActive
                    : null),
                }}
              />
            ))}
          </div>
          <div style={layoutStyles.dots} role="tablist" aria-label="Screenshot picker">
            {screenshots.map((_, index) => (
              <span
                key={index}
                style={
                  index === activeScreenshot
                    ? { ...layoutStyles.dot, ...layoutStyles.dotActive }
                    : layoutStyles.dot
                }
                role="tab"
                aria-selected={index === activeScreenshot}
              />
            ))}
          </div>
          <p style={layoutStyles.caption}>
            Up and running in minutes—watch ChatGPT visits show up right away.
          </p>
        </aside>
      </div>
    </main>
  );
}
