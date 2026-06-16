#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";

const [, , inputPath, componentName, tag = "section"] = process.argv;
if (!inputPath || !componentName) {
  console.error("Usage: node scripts/joyjam-html-to-tsx.mjs <input.html> <ComponentName> [section|footer]");
  process.exit(1);
}

let html = readFileSync(inputPath, "utf8");

html = html.replace(/<div class="flip-circle-slide-css w-embed">[\s\S]*?<\/style><\/div>/g, "");

const styleBlocks = [];
html = html.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => {
  const id = styleBlocks.length;
  styleBlocks.push(css.trim());
  return `__STYLE_BLOCK_${id}__`;
});

function convertAttrs(fragment) {
  let out = fragment;

  out = out.replace(/\sstyle="([^"]*)"/g, (_, style) => {
    const entries = style
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair) => {
        const [k, v] = pair.split(":").map((x) => x.trim());
        const key = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        return `${key}: "${v}"`;
      });
    return ` style={{ ${entries.join(", ")} }}`;
  });

  // Standard DOM props — use React camelCase directly, not spread objects
  const directAttrs = [
    ["maxlength", "maxLength"],
    ["for", "htmlFor"],
    ["href", "href"],
    ["src", "src"],
    ["alt", "alt"],
    ["type", "type"],
    ["name", "name"],
    ["id", "id"],
    ["placeholder", "placeholder"],
    ["method", "method"],
    ["role", "role"],
    ["preload", "preload"],
    ["loading", "loading"],
    ["aria-label", "aria-label"],
    ["aria-hidden", "aria-hidden"],
    ["aria-current", "aria-current"],
  ];

  for (const [htmlAttr, reactAttr] of directAttrs) {
    out = out.replace(new RegExp(`\\s${htmlAttr}="([^"]*)"`, "g"), ` ${reactAttr}="$1"`);
  }

  // Custom / Webflow attributes — spread onto elements
  const spreadAttrs = [
    "data-wf--main-button--variant",
    "data-wf-page-id",
    "data-wf-element-id",
    "data-w-id",
    "view-headline-margin",
    "view-headline-class",
    "view-text-delay",
    "view-text-margin",
    "view-text-class",
    "split-settings",
    "data-expand",
    "scroll-scale",
    "cs-slider-id",
    "data-split",
    "data-levitation",
    "data-rotate",
    "data-action",
    "data-name",
    "jelly-hover-parent",
    "jelly-hover",
    "wave-parent-infinity",
    "wave-parent-default",
    "wave-parent",
    "view-item",
    "view-list",
    "view-headline",
    "view-text",
    "create-spans",
    "create-body-spans",
    "change-color",
    "cta-flip-card",
    "cta-open",
    "cta-close",
    "close-video-trigger",
    "why-us-avatars",
    "white-section",
    "data-lenis-prevent",
    "wr-form",
    "wr-type",
  ];

  for (const attr of spreadAttrs) {
    out = out.replace(new RegExp(`\\s${attr}="([^"]*)"`, "g"), ` {...{ "${attr}": "$1" }}`);
  }

  out = out.replace(/\srequired=""/g, " required");

  // Boolean attributes — only on opening tags, not inside text nodes
  out = out.replace(/<([a-zA-Z][\w-]*)([^>]*?)\sloop(\s|>)/g, "<$1$2 loop$3");
  out = out.replace(/\sloop(?==)/g, " loop");
  out = out.replace(/<([a-zA-Z][\w-]*)([^>]*?)\smuted(\s|>)/g, "<$1$2 muted$3");
  out = out.replace(/<([a-zA-Z][\w-]*)([^>]*?)\srequired(\s|>)/g, "<$1$2 required$3");
  out = out.replace(/\sautoplay\b/g, " autoPlay");
  out = out.replace(/\splaysinline\b/g, " playsInline");

  out = out.replace(/\sclass="/g, ' className="');
  out = out.replace(/\sviewbox="/g, ' viewBox="');
  out = out.replace(/\sfill-rule="/g, ' fillRule="');
  out = out.replace(/\sclip-rule="/g, ' clipRule="');
  out = out.replace(/\sclip-path="/g, ' clipPath="');
  out = out.replace(/\sstroke-width="/g, ' strokeWidth="');
  out = out.replace(/\sstroke-linecap="/g, ' strokeLinecap="');
  out = out.replace(/\sstroke-linejoin="/g, ' strokeLinejoin="');
  out = out.replace(/\sstroke-miterlimit="/g, ' strokeMiterlimit="');
  out = out.replace(/\sfill-opacity="/g, ' fillOpacity="');
  out = out.replace(/\sstop-color="/g, ' stopColor="');
  out = out.replace(/\sstop-opacity="/g, ' stopOpacity="');
  out = out.replace(/\sgradientunits="/g, ' gradientUnits="');
  out = out.replace(/\sgradienttransform="/g, ' gradientTransform="');
  out = out.replace(/\sreadonly\b/g, " readOnly");
  out = out.replace(/<clippath\b/g, "<clipPath");
  out = out.replace(/<\/clippath>/g, "</clipPath>");
  out = out.replace(/<radialgradient\b/g, "<radialGradient");
  out = out.replace(/<\/radialgradient>/g, "</radialGradient>");
  out = out.replace(/<lineargradient\b/g, "<linearGradient");
  out = out.replace(/<\/lineargradient>/g, "</linearGradient>");

  return out;
}

let jsx = convertAttrs(html);

jsx = jsx.replace(/<br>/g, "<br />");
jsx = jsx.replace(/<hr>/g, "<hr />");
jsx = jsx.replace(/<img([^>]*[^/])>/g, "<img$1 />");
jsx = jsx.replace(/<input([^>]*[^/])>/g, "<input$1 />");
jsx = jsx.replace(/<source([^>]*[^/])>/g, "<source$1 />");

for (let i = 0; i < styleBlocks.length; i++) {
  const css = styleBlocks[i].replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
  jsx = jsx.replace(
    `__STYLE_BLOCK_${i}__`,
    `<style dangerouslySetInnerHTML={{ __html: \`${css}\` }} />`
  );
}

const className = basename(inputPath, ".html");
const fileName =
  componentName === "JoyJamFooter"
    ? "footer.tsx"
    : componentName
        .replace(/^JoyJam/, "")
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase()
        .replace(/^-/, "") + ".tsx";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "../app/(main)/about/components/joyjam/sections");
mkdirSync(outDir, { recursive: true });

const out = `"use client";

import { useJoyJamSectionInit } from "../use-joyjam-section-init";

export default function ${componentName}() {
  const ref = useJoyJamSectionInit("${className}");

  return (
    <${tag} ref={ref} className="${className}">
      ${jsx}
    </${tag}>
  );
}
`;

writeFileSync(join(outDir, fileName), out);
console.log(`Wrote ${join(outDir, fileName)}`);
