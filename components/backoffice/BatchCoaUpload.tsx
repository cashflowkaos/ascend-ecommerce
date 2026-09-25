"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  removeBackOfficeBatchCoa,
  saveBackOfficeBatchCoa,
} from "@/app/backoffice/inventory/actions";

type BatchCoaUploadProps = {
  batchId: string;
  productId: string;
  coaUrl: string | null;
};

export default function BatchCoaUpload({
  batchId,
  productId,
  coaUrl,
}: BatchCoaUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleRemove() {
    if (
      !window.confirm(
        "Remove this COA from the batch?"
      )
    ) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const removeData = new FormData();
      removeData.append("batchId", batchId);
      removeData.append("productId", productId);

      await removeBackOfficeBatchCoa(removeData);

      router.refresh();
    } catch {
      setError("Unable to remove COA.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFile(file: File) {
    setUploading(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const uploadResponse = await fetch("/api/backoffice/coa", {
        method: "POST",
        body: uploadData,
      });

      const responseText = await uploadResponse.text();

      let uploadResult: {
        url?: string;
        error?: string;
      } = {};

      if (responseText) {
        try {
          uploadResult = JSON.parse(responseText);
        } catch {
          uploadResult = {};
        }
      }

      if (!uploadResponse.ok || !uploadResult.url) {
        throw new Error(
          uploadResult.error || "Unable to upload COA."
        );
      }

      const saveData = new FormData();
      saveData.append("batchId", batchId);
      saveData.append("productId", productId);
      saveData.append("coaUrl", uploadResult.url);

      await saveBackOfficeBatchCoa(saveData);

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload COA."
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="backoffice-coa">
      <div className="backoffice-coa-actions">
        {coaUrl ? (
          <a
            href={coaUrl}
            target="_blank"
            rel="noreferrer"
            className="backoffice-coa-view"
          >
            View
          </a>
        ) : null}

        <button
          type="button"
          className="backoffice-coa-upload"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? "Uploading..."
            : coaUrl
              ? "Replace"
              : "Upload"}
        </button>

        {coaUrl ? (
          <button
            type="button"
            className="backoffice-coa-remove"
            disabled={uploading}
            onClick={() => void handleRemove()}
          >
            Remove
          </button>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          hidden
          accept="application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void handleFile(file);
            }
          }}
        />
      </div>

      {error ? (
        <div className="backoffice-coa-error" title={error}>
          Upload failed
        </div>
      ) : null}
    </div>
  );
}