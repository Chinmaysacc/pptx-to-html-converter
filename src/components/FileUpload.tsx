interface FileUploadProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUpload({ onFileChange }: FileUploadProps) {
  return (
    <label className="upload-box">
      <input type="file" accept=".pptx" onChange={onFileChange} />
      <span>Click here to upload a PPTX file</span>
    </label>
  );
}
