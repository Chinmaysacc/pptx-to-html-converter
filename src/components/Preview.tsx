interface PreviewProps {
  html: string;
}

export function Preview({ html }: PreviewProps) {
  return (
    <div className="preview">
      <h2>Preview</h2>
      <iframe
        title="Converted PowerPoint"
        sandbox="allow-scripts allow-same-origin"
        srcDoc={html}
        style={{
          width: "100%",
          height: "700px",
          border: "1px solid gray",
        }}
      />
    </div>
  );
}
