// Footer.js
import Link from 'next/link';
import React from 'react';
import { FaAddressBook, FaQrcode, FaFileAlt, FaCog } from 'react-icons/fa';

const Adminhomefooter = () => {
  return (
    <div className="fixed bottom-20 left-0 right-0 bg-white dark:bg-white  flex justify-around">
        <Link href='/Admin/studentlist'>
     <FaAddressBook size={28} style={{ color: 'blue' }} /></Link>
     <Link href='/QrScanner' >
      <FaQrcode size={28} />
      </Link>
      <Link href='/Admin/TransactionRecord'>
      <FaFileAlt size={28} style={{ color: 'blue' }} /></Link>
      <Link href='/Admin/Setting'>
      <FaCog  size={28} />
      </Link>
    </div>
  );
};

export default Adminhomefooter;
