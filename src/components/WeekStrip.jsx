import React from 'react';

export default function WeekStrip({ week, onPrev, onNext }) {
  return (
    <div className="weekstrip-wrapper">
      <div className="weekstrip">
        <button
          type="button"
          onClick={onPrev}
          disabled={week <= 1}
          title="Semaine précédente"
        >
          ‹
        </button>

        <div className="wk">
          <span>Semaine {week}</span>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={week >= 11}
          title="Semaine suivante"
        >
          ›
        </button>
      </div>
    </div>
  );
}
