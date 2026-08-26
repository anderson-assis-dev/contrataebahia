import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { API_URL } from '../../utils/api';
import './Attachments.css';

const resolveUrl = (item) => {
  if (item.data) return item.data;
  const path = item.file_path || item.path;
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}/${String(path).replace(/^\/+/, '')}`;
};

const isImage = (item) => {
  const mime = item.mime_type || item.type || '';
  if (mime.startsWith('image/')) return true;
  return typeof item.data === 'string' && item.data.startsWith('data:image');
};

export default function Attachments({ items }) {
  const [preview, setPreview] = useState(null);
  const list = items || [];
  if (list.length === 0) return null;

  return (
    <>
      <div className="att-grid">
        {list.map((item, index) => {
          const url = resolveUrl(item);
          const name = item.original_name || item.filename || `Arquivo ${index + 1}`;
          if (isImage(item) && url) {
            return (
              <button
                key={`${name}-${index}`}
                type="button"
                className="att-thumb"
                onClick={() => setPreview({ url, name })}
                title={name}
              >
                <img src={url} alt={name} loading="lazy" />
              </button>
            );
          }
          return (
            <a
              key={`${name}-${index}`}
              href={url || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="att-file"
              title={name}
            >
              <FileText size={18} />
              <span>{name}</span>
            </a>
          );
        })}
      </div>

      {preview && (
        <div className="att-lightbox" role="dialog" aria-modal="true" onClick={() => setPreview(null)}>
          <button type="button" className="att-close" aria-label="Fechar">
            <X size={20} />
          </button>
          <img src={preview.url} alt={preview.name} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
