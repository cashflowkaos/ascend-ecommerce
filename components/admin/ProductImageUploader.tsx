"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type ProductImageUploaderProps = {
  initialImage?: string | null;
};

export default function ProductImageUploader({
  initialImage,
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState(
    initialImage ?? ""
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadImage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/admin/product-image",
        {
          method: "POST",
          body: formData,
        }
      );

      const responseText = await response.text();

      let result: {
        url?: string;
        error?: string;
      } = {};

      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          // Preserve the raw response below for debugging.
        }
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            responseText ||
            `Image upload failed (${response.status}).`
        );
      }

      if (!result.url) {
        throw new Error(
          responseText ||
            "Upload completed without returning an image URL."
        );
      }

      setImageUrl(result.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed."
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="admin-field admin-field-full">
      <span>Product Image</span>

      <input
        type="hidden"
        name="image"
        value={imageUrl}
      />

      <div className="admin-product-image-upload">
        {imageUrl ? (
          <div className="admin-product-image-preview">
            <Image
              src={imageUrl}
              alt="Product preview"
              width={220}
              height={220}
              unoptimized
            />
          </div>
        ) : (
          <div className="admin-product-image-empty">
            No image uploaded
          </div>
        )}

        <div className="admin-product-image-upload-actions">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={uploadImage}
            disabled={uploading}
          />

          <small>
            JPG, PNG or WebP. Maximum 5 MB.
          </small>

          {uploading && (
            <strong>Uploading image...</strong>
          )}

          {error && (
            <strong className="admin-stock-low">
              {error}
            </strong>
          )}

          {imageUrl && (
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setImageUrl("")}
              disabled={uploading}
            >
              Remove Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}