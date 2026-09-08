# PPTX to HTML Converter

A browser-based PowerPoint (PPTX) to HTML converter built with **React, TypeScript, and Vite**.

The application converts PowerPoint presentations into HTML directly in the browser and provides a live preview of the converted presentation. Users can download the generated presentation as a standalone HTML file using the **Download HTML** button.

The converter supports presentation resources such as images, audio/video media, fonts, embedded fonts, and responsive preview.

## Features

- Convert `.pptx` presentations to HTML
- Browser-based conversion
- Image support
- Audio and video support
- Font and embedded font handling
- Responsive presentation preview
- Standalone HTML output
- User-controlled HTML download
- WebAssembly-based PPTX rendering

## Tech Stack

- React
- TypeScript
- Vite
- `@briank-dev/pptx-to-html`
- JSZip
- `mtx-decompressor`
- WebAssembly

## Getting Started

### Prerequisites

Make sure you have **Node.js** and **npm** installed.

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Vite will provide a local development URL in the terminal.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Output

After converting a PowerPoint presentation, the generated HTML is displayed in the preview section.

The converted HTML file is downloaded only when the user clicks the **Download HTML** button.

## Limitations

The underlying `@briank-dev/pptx-to-html` renderer currently has a 64 MiB PPTX input limit.

## Documentation

For the detailed project architecture, module responsibilities, conversion pipeline, and implementation notes, see `ARCHITECTURE.md`.