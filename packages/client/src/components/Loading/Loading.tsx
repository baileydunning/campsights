import React from 'react'
import './Loading.css'

const Loading: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="breathing-tent">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            height: '150px',
            width: '150px',
          }}
        >
          <svg
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            width="500"
            height="500"
            viewBox="0 0 32 32"
            aria-label="Campsite Tent Marker"
          >
            <polygon points="6,26 16,6 16,26" fill="#2E8B57" />
            <polygon points="16,6 26,26 16,26" fill="#226E52" />
            <polygon points="14,26 14,14 18,14 18,26" fill="#16563A" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default React.memo(Loading)
