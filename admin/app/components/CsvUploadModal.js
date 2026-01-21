"use client";

import { useEffect, useState } from "react";
import CsvPreviewTable from "./CsvPreviewTable";

const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal modal-wide">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" type="button" onClick={onClose}>
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function CsvUploadModal({
  open,
  onClose,
  uploadTypes,
  selectedType,
  onTypeChange,
  onUpload,
  onApply,
  preview,
  summary,
  reason,
  onReasonChange,
  uploading,
  applying
}) {
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setLocalError(null);
    }
  }, [open]);

  const handleUpload = async () => {
    if (!file) {
      setLocalError("Select CSV file");
      return;
    }
    if (!reason.trim()) {
      setLocalError("Reason is required");
      return;
    }
    setLocalError(null);
    const csvText = await file.text();
    onUpload({ csvText, type: selectedType });
  };

  const errorsCount = summary?.errors || 0;
  const previewRows = preview?.rows || [];

  return (
    <Modal open={open} title="Upload CSV" onClose={onClose}>
      <div className="modal-body">
        {!preview ? (
          <>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="csvType">Upload type</label>
                <select
                  id="csvType"
                  className="select"
                  value={selectedType}
                  onChange={(event) => onTypeChange(event.target.value)}
                >
                  {uploadTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="csvFile">CSV file</label>
                <input
                  id="csvFile"
                  className="input"
                  type="file"
                  accept=".csv"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label htmlFor="csvReason">Reason</label>
                <textarea
                  id="csvReason"
                  className="input"
                  rows={3}
                  value={reason}
                  onChange={(event) => onReasonChange(event.target.value)}
                  placeholder="Почему вы делаете массовую загрузку?"
                />
              </div>
            </div>
            {localError ? <div className="banner error">{localError}</div> : null}
          </>
        ) : (
          <>
            <div className="banner warning">
              This is a bulk upload preview. Changes will not be applied until you confirm.
            </div>
            <CsvPreviewTable rows={previewRows.slice(0, 50)} />
            <div className="helper-text">
              Total: {summary.total} · Valid: {summary.valid} · Warnings: {summary.warnings} · Errors: {summary.errors}
            </div>
          </>
        )}
      </div>
      <div className="modal-actions">
        {preview ? (
          <>
            <button
              className="button"
              type="button"
              onClick={onApply}
              disabled={applying || errorsCount > 0}
            >
              Apply changes
            </button>
            <button className="button ghost" type="button" onClick={onClose}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className="button" type="button" onClick={handleUpload} disabled={uploading}>
              Upload
            </button>
            <button className="button ghost" type="button" onClick={onClose}>
              Cancel
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
