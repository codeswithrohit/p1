import React, { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { toast, ToastContainer } from 'react-toastify'; // Import react-toastify for notifications
import 'react-toastify/dist/ReactToastify.css'; // Import the CSS for toastify

const Test = () => {
  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    const getFingerprint = async () => {
      let storedFingerprint = localStorage.getItem('fingerprint');

      if (storedFingerprint) {
        // Use the stored fingerprint
        setFingerprint(storedFingerprint);
      } else {
        try {
          // Generate a new fingerprint and store it
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          storedFingerprint = result.visitorId;
          localStorage.setItem('fingerprint', storedFingerprint);
          setFingerprint(storedFingerprint);
        } catch (error) {
          toast.error('Failed to generate fingerprint'); // Show error notification
        }
      }
    };

    getFingerprint();
  }, []);

  const copyToClipboard = () => {
    if (fingerprint) {
      try {
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = fingerprint;
        document.body.appendChild(textarea);

        // Select the text in the textarea
        textarea.select();
        document.execCommand('copy');

        // Remove the textarea element
        document.body.removeChild(textarea);

        // Show success notification
        toast.success('Fingerprint copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy fingerprint'); // Show error notification
      }
    } else {
      toast.warning('No fingerprint to copy'); // Show warning notification
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center p-4 bg-white border rounded-md shadow-md">
        <h1 className="text-xl font-semibold mb-4">Your Fingerprint</h1>
        <div className="flex flex-col items-center space-x-2">
          <span className="text-sm font-mono bg-gray-100 p-2 border rounded-md shadow-sm">
            {fingerprint || 'No fingerprint available'}
          </span>
          {fingerprint && (
            <button
              onClick={copyToClipboard}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600"
            >
              Copy Fingerprint
            </button>
          )}
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default Test;
