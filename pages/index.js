import React from 'react'

const index = () => {
  return (
    <div style={{
      backgroundImage: `url('bg1.jpg')`,
      backgroundSize: 'contain', // Changed from 'contain' to 'cover' for full background
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed', // Keeps the background fixed when scrolling
      zIndex: 1, // Ensures that the background is behind other content
    }}></div>
  )
}

export default index