import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { resolveCategoryStyle } from '../../data/categories';
import { attachmentUrl, isImageAttachment } from './Attachments';
import './ListCard.css';

const parseAttachments = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

export default function CardThumb({ attachments, category }) {
  const photos = parseAttachments(attachments).filter((item) => isImageAttachment(item) && attachmentUrl(item));
  const style = resolveCategoryStyle(category || '');
  const Icon = style.icon;

  if (photos.length === 0) {
    return (
      <span className="lcard-media" style={{ background: style.bg, color: style.color }}>
        <Icon size={28} />
      </span>
    );
  }

  return (
    <span className="lcard-media">
      <img src={attachmentUrl(photos[0])} alt="" loading="lazy" />
      {photos.length > 1 && (
        <span className="lcard-count">
          <ImageIcon size={11} />
          {photos.length}
        </span>
      )}
    </span>
  );
}
