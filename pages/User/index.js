import Link from 'next/link';
import React from 'react';

const Index = ({ userdata }) => {
  console.log("homeuserdata", userdata);

  // Assuming userdata is an array and you want to display the first user's information
  const user = userdata && userdata.length > 0 ? userdata[0] : null;

  return (
    <div style={{
      backgroundImage: `url('bg1.jpg')`,
      backgroundSize: 'contain', // Changed from 'contain' to 'cover' for full background
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed', // Keeps the background fixed when scrolling
      zIndex: 1, // Ensures that the background is behind other content
    }} className="flex flex-col justify-between h-screen p-6 bg-gray-100">
      {/* Top Section: User Image and Name */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="user.png" 
            alt="User" 
            className="w-16 h-16 rounded-full object-cover" 
          />
          {user ? (
            <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>
          ) : (
            <h1 className="text-3xl font-bold text-gray-800">No User Data</h1>
          )}
        </div>
      </div>

      {/* Bottom Section: QR Code, Fees, and Receipt */}
      <div className="flex justify-between mb-24 items-center">
        <div className="flex items-center space-x-2">
          <Link href='/QrScanner' >
          <img 
            src="qr.png" 
            alt="QR Code" 
            className="w-24 h-24 object-cover" 
          />
          </Link>
        </div>
        <div className="flex items-center space-x-2">
        <Link href='/User/reciepts' >
          <img 
            src="fee.png" 
            alt="Fees Icon" 
            className="w-24 h-24 object-cover" 
          />
          </Link>
        </div>
        <div className="flex items-center space-x-2">
        <Link href='/User/summary' >
          <img 
            src="reciept.png" 
            alt="Receipt Icon" 
            className="w-24 h-24 object-cover" 
          />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Index;
