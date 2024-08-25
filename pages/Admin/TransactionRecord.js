import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';
import { useRouter } from 'next/router';
import TransactionRecords from '../../components/TransactionRecord';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
const TransactionRecord = () => {
  const installmentHeadings = ['1st ', '2nd ', '3rd '];
  const [registrationData, setRegistrationData] = useState([]);
  const [totalCollection, setTotalCollection] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    // Fetch subjects from Firestore
    const fetchData = async () => {
      try {
        const db = firebase.firestore();
        const subjectsSnapshot = await db.collection('subjects').get();
        const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setSubjects(subjects);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const db = firebase.firestore();
    const docRef = db.collection('registrations');

    docRef
      .get()
      .then((snapshot) => {
        const allRegistrationData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          allRegistrationData.push(data);
        });
        setRegistrationData(allRegistrationData);
      })
      .catch((error) => {
        console.error('Error getting documents:', error);
      });
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      const filteredData = registrationData.filter((data) =>
        data.subjects.some((subject) => subject.subjectName === selectedSubject)
      );

      const totalCollectedAmount = filteredData.reduce((total, data) => {
        const subjectData = data.subjects.find((subject) => subject.subjectName === selectedSubject);
        if (subjectData) {
          return total + parseFloat(subjectData.totalFees || 0);
        }
        return total;
      }, 0);

      const totalInstallments = filteredData.reduce((total, data) => {
        const subjectData = data.subjects.find((subject) => subject.subjectName === selectedSubject);
        if (subjectData && Array.isArray(subjectData.columns)) {
          const installmentAmount = subjectData.columns.reduce((acc, column) => acc + parseFloat(column.amount || 0), 0);
          return total + installmentAmount;
        }
        return total;
      }, 0);

      const remainingBalance = totalCollectedAmount - totalInstallments;
      setTotalCollection(totalCollectedAmount);
      setRemainingBalance(remainingBalance);
    }
  }, [selectedSubject, registrationData]);
  const downloadPDF = () => {
    const input = document.getElementById('pdfTable');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
  
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      heightLeft -= pageHeight;
  
      while (heightLeft >= 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -heightLeft, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
  
      // Get the current date and time
      const now = new Date();
      const dateString = now.toISOString().slice(0, 19).replace(/:/g, '-'); // Format: YYYY-MM-DDTHH-MM-SS
  
      // Create the file name with the current date and time
      const fileName = `transaction-record-${dateString}.pdf`;
  
      // Save the PDF with the generated file name
      pdf.save(fileName);
    });
  };
  return (
    <div className='min-h-screen bg-white' >
      <div  className="bg-gradient-to-b from-sky-400 to-white">
                        <h1 className="text-xl font-semibold mb-4 text-center">Transaction Record</h1>
                    </div>
                    <div id="pdfTable">
                    <h1 className="text-sm text-red-500 font-mono font-bold mb-4 text-start px-2">1. Subject wise Student List</h1>
      <div className="mb-2 px-4">
        <label className="block mb-2 font-mono fon-bold" htmlFor="subjectSelect">
          Select Subject:
        </label>
        <select
          id="subjectSelect"
          className="border bg-white text-lg font-bold font-mono  border-white rounded px-4 py-1"
          onChange={(e) => setSelectedSubject(e.target.value)}
          value={selectedSubject}
        >
          <option value="">Select a Subject</option>
          {subjects.map(sub => (
            <option key={sub.id} value={sub.name}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex mb-4 px-4 ">
        <div className="flex-1 mr-4">
          <h2 className="font-semibold mb-2">Total Collection:</h2>
          <p className="border border-gray-300 rounded p-2">{totalCollection} </p>
        </div>
        <div className="flex-1">
          <h2 className="font-semibold mb-2">Remaining Balance:</h2>
          <p className="border border-gray-300 rounded p-2">{remainingBalance} </p>
        </div>
      </div>
      <div className="overflow-x-auto">
  <table  className="w-full border-collapse border border-gray-300 mb-4">
    <thead>
      <tr className="bg-gray-200">
        <th className="border text-[14px] border-gray-300 px-1 py-1">Student Name</th>
        <th className="border text-[14px] border-gray-300 px-1 py-1">Contact Details</th>
        <th className="border text-[14px] border-gray-300 px-1 py-1">Remain</th>
        {installmentHeadings.map((heading, index) => (
          <th key={index} className="border text-sm border-gray-300 px-4 py-2">
            {heading}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {registrationData.map((student, index) => {
        const subjectsData = student.subjects.find((subject) => subject.subjectName === selectedSubject);
        if (subjectsData) {
          const columnsData = subjectsData.columns || [];
          const totalFees = parseFloat(subjectsData.totalFees || 0);
          const totalSubmitted = columnsData.reduce((acc, column) => acc + parseFloat(column.amount || 0), 0);
          const remain = totalFees - totalSubmitted;

          const installmentAmounts = columnsData.map((column, i) => (
            <td key={i} className="border border-gray-300 px-4 py-2 whitespace-nowrap">
              {column.amount}
            </td>
          ));

          return (
            <tr key={index} className="bg-gray-100">
              <td className="border border-gray-300 px-1 py-1 text-[12px] font-bold whitespace-nowrap">
                {student.firstName} {student.lastName}
              </td>
              <td className="border border-gray-300 px-1 py-1 text-[12px] font-bold whitespace-nowrap">
                {student.callingNumber}
              </td>
              <td className="border border-gray-300 px-1 py-1 text-[12px] font-bold whitespace-nowrap">
                {remain}
              </td>
              {installmentAmounts}
            </tr>
          );
        }
        return null;
      })}
    </tbody>
  </table>
</div>
<button
          onClick={downloadPDF}
          className="bg-blue-500 mt-2 mb-2 text-white px-4 py-2 rounded"
        >
          Download PDF
        </button>
</div>
<h1 className="text-sm text-red-500 font-mono font-bold mb-4 mt-8 text-start px-2">2. Transaction Record</h1>
<TransactionRecords/>
    </div>
  );
}

export default TransactionRecord;
