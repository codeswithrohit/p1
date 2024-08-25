import React from 'react';
import { useRouter } from 'next/router';
import { FaRegCaretSquareLeft } from 'react-icons/fa'; // Import back icon
import { FaRegCircle } from 'react-icons/fa';   // Import circle icon

const Button = () => {
  const router = useRouter();

  // Handle back button click
  const handleBackClick = () => {
    router.back(); // Go back to the previous page
  };

  // Handle home button click
  const handleHomeClick = () => {
    router.push('/'); // Navigate to the home page
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center p-4 bg-white">
      <FaRegCaretSquareLeft
        className="text-black text-2xl absolute left-4 cursor-pointer"
        onClick={handleBackClick}
      />
      <FaRegCircle
        className="text-black text-3xl mx-auto cursor-pointer"
        onClick={handleHomeClick}
      />
    </div>
  );
}

export default Button;
