"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type FreeShippingBarProps = {
  /** Messages that will rotate as the slide loops */
  messages?: string[];
  /** Button label (omit to hide the button) */
  buttonText?: string;
  /** Button link (omit to hide the button) */
  buttonHref?: string;
  /** Hex/RGB background for the bar (matches the example) */
  backgroundColor?: string;
  /** Text color for the message (matches the example) */
  textColor?: string;
  /** Exact page URLs where the bar should be hidden (exact match, like the example) */
  pageHideUrls?: string[];
  /** Extra class on the outer navbar wrapper if needed */
  className?: string;
};

/**
 * FreeShippingBar (Shopify-like slider clone)
 *
 * - Uses the same CSS/animation semantics as the provided example:
 *   - `.navbar .navbar__slide` runs the `qab_slide` keyframes forever
 *   - On each `animationiteration`, we advance to the next message
 *   - `.navbar__slide__btn` runs a simple pulsing `announcementButton` animation
 * - Includes "page hide" logic by checking the current window URL against `pageHideUrls`
 * - No external deps; CSS is embedded with styled-jsx for a drop-in experience
 *
 * Recommended placement: in `app/layout.tsx` so it appears on every page.
 */
export default function FreeShippingBar({
  messages = ["Free Shipping on All Orders $75+!"],
  buttonText = "SHOP NOW",
  buttonHref,
  backgroundColor = "#bfe0f6",
  textColor = "#000000",
  pageHideUrls = [],
  className = "",
}: FreeShippingBarProps) {
  const [idx, setIdx] = useState(0);
  const [hidden, setHidden] = useState(false);
  const slideRef = useRef<HTMLDivElement | null>(null);

  // Normalize messages so we always have at least one
  const safeMessages = useMemo(
    () => (Array.isArray(messages) && messages.length ? messages : [""]),
    [messages]
  );

  // “Page hide” behavior: hide if current URL exactly equals any in pageHideUrls
  useEffect(() => {
    try {
      if (!pageHideUrls.length) return;
      const current = window.location.href;
      for (const raw of pageHideUrls) {
        const trimmed = (raw || "").trim();
        if (trimmed && trimmed === current) {
          setHidden(true);
          break;
        }
      }
    } catch {
      /* no-op on SSR or errors */
    }
  }, [pageHideUrls]);

  // Advance the message on each animation iteration (exact behavior from snippet)
  useEffect(() => {
    const el = slideRef.current;
    if (!el) return;

    const handleIteration = () => {
      setIdx((prev) => (prev + 1) % safeMessages.length);
    };

    // Attach to the actual animated element
    el.addEventListener("animationiteration", handleIteration);
    return () => el.removeEventListener("animationiteration", handleIteration);
  }, [safeMessages.length]);

  if (hidden) return null;

  return (
    <div id="shopify-section-navbar" className={`shopify-section ${className}`}>
      <div className="navbar" style={{ backgroundColor, opacity: 1 }}>
        <div ref={slideRef} className="navbar__slide">
          <div className="navbar__slide__wrapper">
            <div className="navbar__slide__text" style={{ color: textColor }}>
              <span className="m-promo-hide">{safeMessages[idx]}</span>
            </div>

            {buttonHref && buttonText ? (
              <a className="navbar__slide__btn" href={buttonHref}>
                {buttonText}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Styled-JSX: copies the CSS structure & timing from your example */}
      <style jsx global>{`
        .navbar {
          display: flex;
          overflow: hidden;
        }

        .navbar__page-hide {
          display: none;
        }

        .navbar .navbar__slide {
          display: inline-block;
          animation-duration: 7s;
          animation-name: qab_slide;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          animation-delay: 1ms;
          opacity: 0;

          padding-top: 12px;
          padding-bottom: 12px;
          height: auto;
          min-width: 100vw;
        }

        .navbar .navbar__slide.hidden {
          display: none;
        }

        .navbar__slide__wrapper {
          display: inline-block;
          text-align: center;
          width: 100%;
          white-space: nowrap; /* keep text + button on one line like example */
        }

        .navbar__slide__text {
          display: inline-block;
          line-height: 32px;
          font-weight: bold;
          font-family: "Poppins", Arial, sans-serif;
        }

        .navbar__slide__btn {
          color: rgb(255, 255, 255);
          background-color: rgb(0, 0, 0);
          border: none;
          border-radius: 0.25em;
          font-size: 16px;
          font-weight: bold;
          line-height: 2em;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          width: auto;
          margin: 0;
          padding: 0 0.75em;
          cursor: pointer;
          appearance: none;
          outline: none;

          /* These match the example’s animation fields */
          transition: height 0ms linear 300ms;
          animation-delay: 6s;
          animation-duration: 8s;
          animation-iteration-count: infinite;
          animation-name: announcementButton;
          transform-origin: center bottom;

          margin-left: 12px;
        }

        .navbar__slide__btn:hover {
          color: rgb(255, 255, 255);
          background-color: rgb(0, 0, 0);
        }

        @media screen and (min-width: 990px) {
          .navbar .navbar__slide {
            padding-top: 12px;
            padding-bottom: 12px;
          }
        }

        @keyframes qab_slide {
          0% {
            opacity: 1;
            transform: translateX(calc(50vw + 50%));
          }
          5% {
            transform: translateX(calc(50vw + 50%));
          }
          20% {
            transform: translateX(0%);
          }
          80% {
            transform: translateX(0%);
          }
          95% {
            transform: translateX(calc(-50vw - 50%));
          }
          100% {
            transform: translateX(calc(-50vw - 50%));
            opacity: 1;
          }
        }

        /* The original snippet references this but didn't include frames;
           we add a gentle pulse that starts after the slide is on-screen. */
        @keyframes announcementButton {
          0%,
          60% {
            transform: scale(1);
            box-shadow: none;
          }
          70% {
            transform: scale(1.04);
            box-shadow: 0 6px 16px var(--announcementButtonShadow, rgba(0, 0, 0, 0.2));
          }
          80% {
            transform: scale(1);
            box-shadow: none;
          }
          100% {
            transform: scale(1);
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
