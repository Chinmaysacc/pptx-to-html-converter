import { useState } from "react";
import { FileUpload } from "./components/FileUpload";
import { ConvertButton } from "./components/ConvertButton";
import { Preview } from "./components/Preview";
import { ErrorMessage } from "./components/ErrorMessage";
import { convertPptxToHtml } from "./services/pptxConverter";
import { downloadHtml } from "./utils/htmlDownload";
import "./App.css";
function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [htmlOutput, setHtmlOutput] = useState("");
  const [standaloneHtml, setStandaloneHtml] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pptx")) {
      alert("Please select a PowerPoint (.pptx) file.");
      return;
    }

    setSelectedFile(file);
    setHtmlOutput("");
    setStandaloneHtml("");
    setError("");
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    try {
      setIsConverting(true);
      setError("");

      const { previewHtml, standaloneHtml } =
        await convertPptxToHtml(selectedFile);

      setHtmlOutput(previewHtml);
      setStandaloneHtml(standaloneHtml);
    } catch (err) {
      console.error(err);
      setError(
        "Conversion failed. Check the browser console."
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!standaloneHtml) return;

    downloadHtml(
      standaloneHtml,
      "converted-presentation.html"
    );
  };

  return (
    <div className="app">
      <div className="container">

        <div className="header">
          <div className="header-badge">
            <span className="badge-chip badge-pptx">PPTX</span>
            <span className="badge-arrow">→</span>
            <span className="badge-chip badge-html">HTML</span>
          </div>

          <h1>
            PowerPoint to HTML
          </h1>

          <p>
            Convert your PowerPoint presentation into a
            standalone HTML file directly in your browser.
          </p>
        </div>

        <div className="converter-card">

          <FileUpload
            onFileChange={handleFileChange}
          />

          {selectedFile && (
            <div className="selected-file">

              <div className="file-icon">
                PPT
              </div>

              <div className="file-details">
                <span className="file-label">
                  Selected presentation
                </span>

                <strong>
                  {selectedFile.name}
                </strong>
              </div>

              <div className="file-status">
                Ready
              </div>

            </div>
          )}

          {selectedFile && (
            <ConvertButton
              onClick={handleConvert}
              disabled={isConverting}
            />
          )}

          <ErrorMessage message={error} />

        </div>

        {htmlOutput && (
          <div className="preview-section">

            <div className="section-header">
              <div>
                <span className="section-label">
                  Result
                </span>

                <h2>
                  Presentation Preview
                </h2>

                <p>
                  Your converted presentation is ready.
                </p>
              </div>
            </div>

            <Preview html={htmlOutput} />

            <div className="download-card">

              <div className="download-info">
                <div className="download-icon">
                  ↓
                </div>

                <div>
                  <strong>
                    Download HTML
                  </strong>

                  <span>
                    Save the converted presentation as a
                    standalone HTML file.
                  </span>
                </div>
              </div>

              <button
                className="download-button"
                onClick={handleDownload}
              >
                <span>Download HTML</span>
                <span className="download-arrow">
                  ↓
                </span>
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default App;