import React from 'react';

function Alert({ type, message }) {
  return (
    <div className={`alert alert-${type}`}>
      {type === 'success' && ''}
      {type === 'error' && ''}
      {type === 'info' && ''}
      {message}
    </div>
  );
}

export default Alert;
