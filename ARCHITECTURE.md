# PPTX to HTML Converter

A browser-based PowerPoint (PPTX) to HTML converter built with **React, TypeScript, and Vite**.

The application converts PowerPoint presentations into HTML directly in the browser and provides a live preview along with an option to download the converted presentation as a standalone HTML file.

The project follows a modular architecture where the user interface, PPTX extraction, HTML processing, media handling, font handling, and utility functions are separated into independent modules.

---

## ✨ Features

- 📂 Upload `.pptx` presentations
- ⚡ Client-side PPTX to HTML conversion
- 🖼️ Extract and inject presentation images
- 🎥 Audio and video media support
- 🔤 Font information extraction
- 📦 Embedded font extraction and conversion
- 🎨 Apply extracted fonts to generated text runs
- 📐 Preserve PowerPoint slide dimensions
- 📱 Responsive HTML preview
- 👀 Live presentation preview
- 💾 Download converted presentation as standalone HTML
- 🌐 Runs entirely in the browser
- 🧩 Modular and maintainable project structure

---

# 🏗️ Architecture

The application is organized into separate layers based on responsibility.

```text
                         ┌──────────────────────┐
                         │      PPTX Upload     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       App.tsx        │
                         │   React UI + State   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ pptxConverter.ts     │
                         │ Conversion Pipeline  │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       Slide Size              Media                 Images
       Extraction             Extraction            Extraction
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                                    ▼
                              Font Processing
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
              Font Information               Embedded Fonts
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                           pptxToHtml()
                                    │
                                    ▼
                         Generated HTML Output
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       Image Injection       Font Injection        Media Injection
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                                    ▼
                         Responsive Processing
                                    │
                                    ▼
                            HTML Preview
                                    │
                                    ▼
                         Blob URL → Data URL
                                    │
                                    ▼
                     Standalone HTML Download
```

---

# 📁 Project Structure

```text
src/
│
├── App.tsx
├── App.css
├── index.css
├── main.tsx
│
├── components/
│   ├── FileUpload.tsx
│   ├── ConvertButton.tsx
│   ├── Preview.tsx
│   └── ErrorMessage.tsx
│
├── services/
│   ├── pptxConverter.ts
│   ├── mediaExtractor.ts
│   ├── imageExtractor.ts
│   ├── fontExtractor.ts
│   ├── embeddedFontExtractor.ts
│   └── slideSizeExtractor.ts
│
├── processors/
│   ├── imageInjector.ts
│   ├── mediaInjector.ts
│   ├── fontInjector.ts
│   ├── responsiveProcessor.ts
│   └── standaloneHtmlProcessor.ts
│
├── utils/
│   ├── emu.ts
│   ├── blobToDataUrl.ts
│   ├── htmlDownload.ts
│   ├── htmlParser.ts
│   └── pptxMedia.ts
│
└── types/
    ├── media.ts
    ├── image.ts
    ├── font.ts
    └── pptx.ts
```

---

# 🔄 Conversion Pipeline

The conversion process follows a structured pipeline:

```text
Upload PPTX
     │
     ▼
App State
     │
     ▼
pptxConverter.ts
     │
     ├── Extract slide size
     │
     ├── Extract audio/video
     │
     ├── Extract images
     │
     ├── Extract font information
     │
     ├── Extract embedded fonts
     │
     ▼
pptxToHtml()
     │
     ▼
Generated HTML
     │
     ├── Inject images
     │
     ├── Inject embedded fonts
     │
     ├── Apply fonts to text runs
     │
     ├── Inject audio/video
     │
     ├── Make preview responsive
     │
     ▼
Preview HTML
     │
     ▼
Blob URLs → Data URLs
     │
     ▼
Standalone HTML
     │
     ▼
User clicks Download
```

---

# 🧩 Module Responsibilities

## `App.tsx`

Responsible for the application UI and React state.

It handles:

- Selected PPTX file
- Conversion state
- Conversion errors
- Preview HTML
- Standalone HTML output
- Download action

The component coordinates the workflow but does not perform PPTX parsing or HTML transformation itself.

---

## `components/`

Contains reusable UI components.

### `FileUpload.tsx`

Handles PPTX file selection.

### `ConvertButton.tsx`

Controls the conversion action and loading state.

### `Preview.tsx`

Displays the generated HTML presentation inside the application.

### `ErrorMessage.tsx`

Displays conversion errors to the user.

---

# ⚙️ Services

The `services` layer is responsible for extracting information from the PPTX file and coordinating the conversion process.

## `pptxConverter.ts`

Acts as the main conversion orchestrator.

It coordinates:

1. PPTX extraction
2. Slide size detection
3. Media extraction
4. Image extraction
5. Font extraction
6. Embedded font extraction
7. PPTX → HTML rendering
8. HTML post-processing
9. Responsive preview generation
10. Standalone HTML generation

---

## `mediaExtractor.ts`

Extracts media information from the PowerPoint package.

It identifies media such as:

- Audio
- Video
- Images

and provides structured information to the processors.

---

## `imageExtractor.ts`

Handles image-related PPTX XML processing.

It extracts:

- Image relationships
- Image positioning
- Image dimensions
- Image transformations
- Grouped images

---

## `fontExtractor.ts`

Extracts font information used by PowerPoint text.

This information is later used to apply appropriate `font-family` values to generated HTML text runs.

---

## `embeddedFontExtractor.ts`

Handles embedded font resources stored inside the PPTX package.

The extracted embedded font data can be converted into browser-compatible font formats and later embedded into the generated HTML.

---

## `slideSizeExtractor.ts`

Reads the PowerPoint presentation dimensions and provides the slide size used during HTML processing.

---

# 🖼️ HTML Processors

The `processors` layer modifies the HTML generated by the PPTX renderer.

This separation keeps extraction logic independent from HTML transformation logic.

---

## `imageInjector.ts`

Injects extracted images into the generated HTML.

It also prevents duplicate image insertion where required.

---

## `mediaInjector.ts`

Injects audio and video elements into the generated HTML.

The processor uses type-specific media matching so audio and video elements on the same slide do not accidentally share the same media controls.

---

## `fontInjector.ts`

Handles two font-related operations:

### Embedded font injection

Embeds extracted font data into the generated HTML.

### Text-run font application

Applies extracted font-family information to generated text runs.

---

## `responsiveProcessor.ts`

Transforms the generated presentation markup so that the preview behaves responsively within the application.

---

## `standaloneHtmlProcessor.ts`

Prepares the final HTML for standalone use.

Blob URLs are converted into Data URLs so that resources can remain embedded inside the downloaded HTML file.

---

# 🛠️ Utilities

The `utils` directory contains reusable helper functions that are independent of the main conversion pipeline.

### `emu.ts`

Contains PowerPoint EMU-related conversion helpers.

### `blobToDataUrl.ts`

Converts Blob URLs into Data URLs.

### `htmlDownload.ts`

Creates the downloadable HTML file and triggers the browser download.

### `htmlParser.ts`

Provides HTML parsing/manipulation utilities.

### `pptxMedia.ts`

Contains helpers related to PPTX media resources.

---

# 📝 Types

The `types` directory contains shared TypeScript definitions.

```text
types/
├── media.ts
├── image.ts
├── font.ts
└── pptx.ts
```

Keeping shared types separate helps avoid duplicated interfaces and makes the modules easier to maintain.

---

# 🔤 Font Handling

Font processing is divided into two different responsibilities.

### Font Information

The application determines which fonts are referenced by presentation text.

### Embedded Fonts

If the PowerPoint contains embedded font resources, they are extracted separately and processed so that the generated HTML can retain those resources.

This distinction is important because knowing the name of a font and obtaining the actual embedded font binary are two different operations.

---

# 🎬 Media Handling

The converter supports presentation media such as:

- Audio
- Video
- Images

Media extraction and media injection are intentionally separated.

```text
PPTX
 │
 ▼
Media Extraction
 │
 ▼
Structured Media Data
 │
 ▼
HTML Generation
 │
 ▼
Media Injection
 │
 ▼
Final HTML
```

The media processor also uses type-specific matching for media posters to prevent audio and video elements from incorrectly sharing the same controls.

---

# 🧱 Core Conversion Library

The project uses:

```text
@briank-dev/pptx-to-html
```

as the core PowerPoint-to-HTML rendering engine.

The modular application builds additional processing around the renderer for:

- Images
- Media
- Fonts
- Embedded fonts
- Responsive preview
- Standalone HTML output

This allows the core rendering library to remain responsible for PPTX → HTML conversion while application-specific processing remains modular.

---

# 🧬 WebAssembly

The PPTX rendering process uses WebAssembly.

The project includes the required WASM asset under:

```text
public/
└── pptx2html_wasm_bg.wasm
```

The application provides the WASM asset through a stable public URL so that the renderer can load it correctly in both development and production environments.

---

# 💾 Output

After conversion, the application provides two outputs:

### Live Preview

The generated presentation is displayed directly inside the application.

### Standalone HTML

The generated resources are converted into self-contained data URLs where required, allowing the final presentation to be downloaded as an HTML file.

The HTML download is **user-triggered** through the Download button below the preview.

---

# 🚀 Getting Started

## Prerequisites

- Node.js
- npm

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd pptx-to-html-converter
```

Install dependencies:

```bash
npm install
```

---

# ▶️ Development

Start the development server:

```bash
npm run dev
```

The application will be available at the local Vite development URL.

---

# 🏗️ Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

# 🌐 Deployment

The application is a client-side React/Vite application and can be deployed to static hosting platforms such as:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

No application backend is required for the current conversion workflow.

---

# ⚠️ Limitations

The underlying `@briank-dev/pptx-to-html` renderer currently has a **64 MiB PPTX input limit**.

This modular architecture does not bypass that limitation.

Very large presentations may therefore fail during conversion.

---

# 🔮 Future Improvements

Possible future improvements include:

- Drag-and-drop file upload
- Conversion progress indicators
- Multiple PPTX files
- Custom HTML export settings
- Improved mobile preview
- Presentation navigation controls
- Better conversion error reporting
- More advanced media controls
- Additional PowerPoint feature support

---

# 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type safety |
| Vite | Development and build tooling |
| JSZip | PPTX ZIP/package processing |
| `@briank-dev/pptx-to-html` | PPTX → HTML rendering |
| `mtx-decompressor` | Embedded font processing |
| WebAssembly | PPTX rendering runtime |

---

# 📌 Project Philosophy

The main goal of the architecture is **separation of responsibilities**.

Instead of keeping the entire conversion process inside one large component, the application separates:

```text
UI
│
├── Components
│
├── Conversion Services
│
├── HTML Processors
│
├── Utilities
│
└── Shared Types
```

This makes the project easier to:

- Understand
- Debug
- Test
- Extend
- Maintain
- Explain during technical interviews

---

# 👨‍💻 Author

**Chinmay Sawant**

Artificial Intelligence & Machine Learning Engineer

---

## ⭐ If you find this project useful

Feel free to star the repository and explore the implementation.