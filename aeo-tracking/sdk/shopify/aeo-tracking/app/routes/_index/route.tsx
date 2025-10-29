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

  const layoutStyles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4rem 1.5rem",
      background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
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
      boxShadow: "0 40px 80px rgba(79, 70, 229, 0.12)",
    },
    pitch: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1.5rem",
    },
    tag: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      color: "#3730a3",
      background: "rgba(79, 70, 229, 0.12)",
      borderRadius: "999px",
      padding: "0.45rem 0.85rem",
    },
    title: {
      fontSize: "2.25rem",
      lineHeight: 1.2,
      color: "#0f172a",
      margin: 0,
    },
    lede: {
      fontSize: "1.05rem",
      lineHeight: 1.6,
      color: "#475569",
      margin: 0,
    },
    highlights: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "grid",
      gap: "0.9rem",
      color: "#1e293b",
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
      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.15)",
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
      color: "#111827",
    },
    input: {
      borderRadius: "0.75rem",
      border: "1px solid #cbd5f5",
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
      background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
      cursor: "pointer",
      boxShadow: "0 12px 24px rgba(99, 102, 241, 0.25)",
    },
    linkRow: {
      fontSize: "0.9rem",
      color: "#4c1d95",
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
      border: "1px solid rgba(99, 102, 241, 0.15)",
      background: "#f1f5f9",
      boxShadow: "0 25px 60px rgba(148, 163, 184, 0.35)",
    },
    caption: {
      fontSize: "0.9rem",
      color: "#475569",
      textAlign: "center" as const,
      margin: 0,
    },
  };

  return (
    <main style={layoutStyles.page}>
      <div style={layoutStyles.shell}>
        <section style={layoutStyles.pitch} aria-label="AEO tracking overview">
          <span style={layoutStyles.tag}>Shumbird AEO tracking</span>
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
            <img
              src="/images/demo.png"
              alt="Dashboard preview showing ChatGPT traffic and integration code"
              loading="lazy"
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </div>
          <p style={layoutStyles.caption}>
            Up and running in minutes—watch ChatGPT visits show up right away.
          </p>
        </aside>
      </div>
    </main>
  );
}
