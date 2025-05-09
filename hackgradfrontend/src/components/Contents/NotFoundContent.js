//Generic Not found page for missing links or wrong address
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundContent = () => {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
        Post Not Found
      </h2>
      <p style={{ color: '#777', fontSize: '1rem' }}>
        The content you're looking for doesn't exist or was removed.
      </p>
      <Link
        to="/"
        style={{
          marginTop: '30px',
          display: 'inline-block',
          padding: '10px 20px',
          backgroundColor: '#4e54c8',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '5px',
        }}
      >
        ← Go back to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundContent;