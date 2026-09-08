export async function blobUrlToDataUrl(
  blobUrl: string
): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to convert Blob to Data URL"));
    };

    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}
