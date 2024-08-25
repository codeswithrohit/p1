import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/router';

const Test3 = () => {
  const [scanResult, setScanResult] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render(success, error);

    function success(result) {
      scanner.clear();
      setScanResult(result);
      router.push(result); // Redirect to the scanned result
    }

    function error(err) {
      console.warn(err);
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>
      {scanResult ? (
        <div className="text-center">
          <p className="mb-4 text-lg font-semibold text-green-600">Scan Result:</p>
          <a
            href={`http://${scanResult}`}
            className="text-blue-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {scanResult}
          </a>
        </div>
      ) : (
        <div id="reader" className="border border-gray-300 p-4 bg-white rounded-lg shadow-md"></div>
      )}
    </div>
  );
};

export default Test3;
