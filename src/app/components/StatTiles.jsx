import React from 'react';
import { formatMoney } from '../../utils/format';
import './StatTiles.css';

export default function StatTiles({ items, loading }) {
  return (
    <div className="stat-tiles">
      {items.map(({ label, value, icon: Icon, money }) => (
        <div key={label} className="stat-tile">
          <span className="stat-tile-ico">
            <Icon size={17} />
          </span>
          {loading ? (
            <span className="skel stat-tile-skel" />
          ) : (
            <strong>{money ? formatMoney(value) : value}</strong>
          )}
          <span className="stat-tile-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
