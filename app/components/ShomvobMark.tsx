import Image from "next/image";

/**
 * Shomvob's mark on the slides, drawn the way the A4 proposals draw it
 * (CoverPage, LetterheadFrame): the icon as an image, "Shomvob HR" as live
 * text beside it.
 *
 * It replaces the baked-in wordmark image (shomvob_hr_text.png). As text, the
 * name stays sharp in a PDF and takes a colour that reads on the slide behind
 * it — the wordmark's lime "HR" all but disappeared on the light slides.
 *
 * Proportions are the proposals' (icon 11mm, text 17pt, gap 3mm), scaled. The
 * text keeps the inherited 1.5 line height, as there: with `items-end`, that
 * is what sets its baseline level with the icon's feet.
 *
 * The icon's alt is empty because the text beside it already says the name.
 * That also keeps globals.css's `img[alt="Shomvob HR"]` rules, written for the
 * old wordmark, from filtering it.
 */

const SIZES = {
  sm: { icon: "h-[1.83rem]", text: "text-base", gap: "gap-2" },
  md: { icon: "h-[2.18rem]", text: "text-[1.19rem]", gap: "gap-[0.6rem]" },
  lg: { icon: "h-[2.64rem]", text: "text-[1.44rem]", gap: "gap-3" },
} as const;

export default function ShomvobMark({
  tone,
  size = "md",
}: {
  /** The background the mark sits on. */
  tone: "dark" | "light";
  size?: keyof typeof SIZES;
}) {
  const { icon, text, gap } = SIZES[size];

  return (
    <span className={`inline-flex shrink-0 items-end ${gap}`}>
      <Image
        src="/resources/shomvob_hr_logo.png"
        alt=""
        width={512}
        height={512}
        // The 14 KB original rather than a resized copy: it stays sharp when a
        // PDF of the deck is zoomed.
        unoptimized
        className={`${icon} w-auto`}
      />
      <span
        className={`whitespace-nowrap font-sans font-bold ${text} ${
          tone === "dark" ? "text-white" : "text-[#0f623b]"
        }`}
      >
        Shomvob HR
      </span>
    </span>
  );
}
