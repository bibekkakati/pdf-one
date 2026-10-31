# Architecture rules

- PDFViewer mounts a single keyed React-PDF Page for the main view; sidebar thumbnails render only while scrolled into view (IntersectionObserver) so large PDFs stay light.
- All page additions (signature, image, mask, text) are one `EditorElement` list in Workspace state, stored in PDF points with a top-left origin; `src/lib/editorElements.ts` owns the type and the pdf-lib export so the screen and the download use the same geometry.
- The right sidebar shows the selected element's settings when something is selected, otherwise the tool picker.
- Keep the right sidebar and signature editor mounted while hidden, including when tools or selected-element settings change; each force-mounted accordion method retains its own draft and passes its own image directly to placement, preventing draft loss or placing the wrong signature.
- Compare the current element snapshot with the last successfully exported snapshot for exit warnings; capture the export snapshot before async work so later edits remain protected.
- Filename editing is isolated from the PDF object URL so renaming preserves the current page, zoom, and placed edits; explicit names are used verbatim for downloads.
- Workspace undo/redo lives in `useHistoryState` (one source of history); sidebar panels are in `components/workspace/`, page overlay and controls in `components/viewer/`, so pages only orchestrate state.
- Only the shadcn/ui components actually used are kept in `components/ui`; re-add others via shadcn when needed rather than keeping unused scaffolding.

- The landing page is prerendered at build time (vite.config.ts plugin + src/entry-server.tsx) into dist/index.html for SEO; keep Landing free of browser-only APIs during render.
- The working document is `{ elements, pages }` in one history state: `PageEntry` (src/lib/pageModel.ts) lists pages in order with delete/blank flags (no rotation), and elements attach by `pageId`, so page edits are non-destructive until `exportPdf` rebuilds the file on download; passwords are applied last via pdf-encrypt-lite since pdf-lib cannot encrypt.
- The landing page hands the PDF to the workspace via an in-memory copy plus a background IndexedDB save for refreshes (src/lib/pdfStorage.ts), not sessionStorage (~5 MB cap); uploads are limited to 50 MB.
- Opening reads page sizes in the PDF.js worker (src/lib/pdfInspect.ts) to keep the main thread free; files with /Encrypt go through strict pdf-lib readPages so protection is still detected. Thumbnails render at 1x and only after the main page paints.

- On screens narrower than 1080px the workspace swaps the viewport meta to a fixed 1280px desktop width (restored on leave) instead of a separate mobile layout; landing stays responsive.
- Open uploads through strict readPages first and commit the file and page model together; only EncryptedPDFError opens Unlock, avoiding a separate protection scan and preserving the existing document on failed replacements.
