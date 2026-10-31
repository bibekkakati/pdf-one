<div align="center">

  <img src="public/logo.png" alt="PDF One Logo" width="80" height="80" />

# PDF One

**A free, privacy-first PDF editor and signer that runs entirely in your browser.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25_Client--Side-brightgreen?style=flat-square)](#-privacy--security)

  <p>
    Documents are processed directly on your device and are never uploaded to any remote server.<br />
    No accounts, no watermarks, and no tracking.
  </p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-build--preview">Build</a> •
    <a href="#-deployment">Deployment</a> •
    <a href="#-privacy--security">Privacy & Security</a>
  </p>

</div>

---

## ✨ Features

| Feature                 | Description                                                                                                                                            |
| :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **✍️ Sign**             | Draw, type with realistic handwriting fonts, or upload signature images with built-in crop, background removal, and sharpening filters.                |
| **📝 Text**             | Add custom text boxes with complete control over font size, color, bold, italic, and underline styling.                                                |
| **🖍️ Highlight**        | Mark passages with an authentic, translucent highlighter stroke.                                                                                       |
| **✏️ Draw**             | Freehand sketching and annotations with customizable brush colors and stroke widths.                                                                   |
| **⬛ Box & Redact**     | Cover sensitive information or content with resizable solid-color shapes.                                                                              |
| **🖼️ Image**            | Insert external images with built-in cropping, scaling, and repositioning tools.                                                                       |
| **📄 Page Management**  | Insert blank pages, reorder existing pages, or delete pages non-destructively; changes apply on download.                                              |
| **🔐 Protect**          | Set, modify, or strip PDF passwords, plus securely decrypt password-protected files client-side.                                                       |
| **🔍 Viewing Tools**    | Virtualized single-page rendering for large files, lazy-loaded thumbnails, zoom controls, layout grid/margin guides, and a presentation laser pointer. |
| **⚡ Editing Workflow** | Global undo/redo history, editable document naming, and leave confirmation prompts to protect unsaved work.                                            |

---

## 🛠️ Tech Stack

### Core & UI

- **Framework:** [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite 5](https://vitejs.dev/) (with fast React SWC transforms)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Component Primitives:** [Radix UI](https://www.radix-ui.com/) via [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Routing:** [React Router](https://reactrouter.com/)

### PDF Engine & Cryptography

- **Rendering:** [react-pdf](https://github.com/wojtekmaj/react-pdf) / [PDF.js](https://mozilla.github.io/pdf.js/) (offloaded worker inspection)
- **Export & Composition:** [pdf-lib](https://pdf-lib.js.org/) for vector-accurate document generation
- **Encryption / Decryption:** `@pdfsmaller/pdf-encrypt-lite` & `@pdfsmaller/pdf-decrypt`
- **Client Persistence:** IndexedDB for large document persistence across tab reloads (bypassing `sessionStorage` limits)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun**

### 1. Clone & Install

```sh
git clone https://github.com/bibekkakati/pdf-one.git
cd pdf-one
npm install
```

### 2. Run the Development Server

```sh
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### 3. Test & Lint

```sh
# Run tests
bun test

# Run ESLint
npm run lint
```

---

## 🏗️ Build & Preview

Compile the project for production:

```sh
npm run build
```

The production output will be generated in `dist/`. The landing page is prerendered at build time via Vite SSR integration for instantaneous loading speeds and SEO.

Preview the compiled production bundle locally:

```sh
npm run preview
```

---

## 🌐 Deployment

PDF One compiles to static assets and can be hosted on any static hosting platform or CDN:

### Static Hosting Providers

- **Vercel** / **Netlify** / **Cloudflare Pages** / **GitHub Pages** / **AWS S3 + CloudFront**

### Deployment Steps

1. Execute `npm run build`.
2. Deploy the `dist/` folder to your provider.
3. Ensure single-page application (SPA) rewrite rules redirect unknown routes (such as `/workspace`) to `/index.html`.

---

## 🔒 Privacy & Security

PDF One is engineered from the ground up to respect user privacy:

- **Zero Remote Processing:** All parsing, rendering, element placing, redaction, and encryption happen directly inside the client's web browser.
- **No Cloud Uploads:** No document bytes ever leave your device.
- **Local Persistence:** Documents and unsaved drafts are stored safely within the browser's sandboxed IndexedDB storage.
- **Password Safety:** Encryption and decryption keys are handled strictly in-memory during export.
