import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';
import { useRouter } from 'next/router';
import TransactionRecords from '../../components/TransactionRecord';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const TransactionRecord = () => {
  const installmentHeadings = ['1st ', '2nd ', '3rd '];
  const [registrationData, setRegistrationData] = useState([]);
  const [totalCollection, setTotalCollection] = useState(0);
  const [totalamount, setTotalAmount] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [expanded1, setExpanded1] = useState(false);

  const toggleExpansion = () => {
    setExpanded(!expanded);
  };
  const toggleExpansion1 = () => {
    setExpanded1(!expanded1);
  };

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

        // Calculate "remain" for each registration data entry
        const sortedData = allRegistrationData.map(student => {
          const subjectsData = student.subjects.find(subject => subject.subjectName === selectedSubject);
          if (subjectsData) {
            const totalFees = parseFloat(subjectsData.totalFees || 0);
            const totalSubmitted = (subjectsData.columns || []).reduce((acc, column) => acc + parseFloat(column.amount || 0), 0);
            const remain = totalFees - totalSubmitted;
            return { ...student, remain }; // Add the "remain" field to each student
          }
          return { ...student, remain: 0 };
        });

        // Sort by "remain" in descending order
        sortedData.sort((a, b) => b.remain - a.remain);

        setRegistrationData(sortedData);
      })
      .catch((error) => {
        console.error('Error getting documents:', error);
      });
  }, [selectedSubject]);

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
      const tottalamount = totalCollectedAmount - remainingBalance
      setTotalAmount(tottalamount)
      setTotalCollection(totalCollectedAmount);
      setRemainingBalance(remainingBalance);
    }
  }, [selectedSubject, registrationData]);

  const downloadPDF = () => {
    // Get the current date and time
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
    // Generate the file name for the PDF
    const subjectName = selectedSubject || "Subject";
    const fileName = `Statement of ${subjectName} - ${formattedDate} ${formattedTime}.pdf`;
  
    const docDefinition = {
      content: [
        {
          text: `Transaction Record for ${subjectName}`,
          style: 'header',
        },
        {
          columns: [
            {
              width: '*',
              text: `Total Collection: ${totalamount}`,
              style: 'subheader',
            },
            {
              width: '*',
              text: `Remaining Balance: ${remainingBalance}`,
              style: 'subheader',
            },
          ],
          columnGap: 10, // Adjust spacing between columns
        },
        {
          table: {
            headerRows: 1,
            widths: [100, 150, 100, ...installmentHeadings.map(() => '*')],
            body: [
              [
                { text: 'Student Name', style: 'tableHeader' },
                { text: 'Contact Details', style: 'tableHeader' },
                { text: 'Remain', style: 'tableHeader' },
                ...installmentHeadings.map(heading => ({ text: heading, style: 'tableHeader' })),
              ],
              ...registrationData
                .map((student) => {
                  const subjectsData = student.subjects.find((subject) => subject.subjectName === selectedSubject);
                  if (subjectsData) {
                    const columnsData = subjectsData.columns || [];
                    const totalFees = parseFloat(subjectsData.totalFees || 0);
                    const totalSubmitted = columnsData.reduce((acc, column) => acc + parseFloat(column.amount || 0), 0);
                    const remain = totalFees - totalSubmitted;
  
                    const installmentAmounts = columnsData.map((column) => column.amount || '');
  
                    // Ensure the row has the correct number of columns
                    const row = [
                      `${student.firstName} ${student.lastName}`,
                      student.callingNumber,
                      remain,
                      ...installmentAmounts,
                    ];
  
                    // Fill the row with empty strings if it has fewer columns than required
                    while (row.length < installmentHeadings.length + 3) {
                      row.push('');
                    }
  
                    return row.map(cell => ({ text: cell, style: 'tableCell' })); // Apply style to each cell
                  }
                  return null; // Return null instead of an empty array
                })
                .filter(row => row !== null), // Filter out any null rows
            ],
          },
          layout: {
            fillColor: (rowIndex) => (rowIndex === 0 ? '#f2f2f2' : null), // Light background for the header row
            hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 0.5), // No line at top and bottom
            vLineWidth: (i) => 0.5,
            hLineColor: () => '#dddddd', // Light grey for horizontal lines
            vLineColor: () => '#dddddd', // Light grey for vertical lines
            paddingLeft: (i) => 5,  // Less padding on the left
            paddingRight: (i) => 5, // Less padding on the right
            paddingTop: (i) => 4,   // Reduced padding on the top
            paddingBottom: (i) => 4 // Reduced padding on the bottom
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black',
          alignment: 'center',
          fillColor: '#e0e0e0', // Light grey background for headers
          margin: [0, 5, 0, 5],
        },
        tableCell: {
          fontSize: 10,
          alignment: 'center',
          margin: [0, 3, 0, 3], // Reduced margin for less spacing
        },
      },
    };
  
    // Download the PDF with the new file name
    pdfMake.createPdf(docDefinition).download(fileName);
  };

  
  
  

  return (
    <div className='min-h-screen bg-white'>
      <div className="bg-gradient-to-b from-sky-400 to-white">
        <h1 onClick={toggleExpansion} className="text-xl font-semibold mb-4 text-center">Transaction Record</h1>
      </div>
      <div id="pdfTable">
        <h1 
          className="text-xl px-4 text-red-500 font-mono font-bold mb-4 text-start cursor-pointer flex items-center"
          onClick={toggleExpansion}
        >
          <span className="mr-2">
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </span>
          1. Subject wise Student List
        </h1>
        {expanded && (
          <>
            <div className="mb-2 px-4">
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
            {/* <div className="flex mb-4 px-4 ">
              <div className="flex-1 mr-4">
                <h2 className="font-semibold mb-2">Total Collection:</h2>
                <p className="border border-gray-300 rounded p-2">{totalCollection} </p>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold mb-2">Remaining Balance:</h2>
                <p className="border border-gray-300 rounded p-2">{remainingBalance} </p>
              </div>
            </div>
            <div className="px-4 overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 mb-4">
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
                          <td className="border border-gray-300 px-4 py-2">{student.firstName} {student.lastName}</td>
                          <td className="border border-gray-300 px-4 py-2">{student.callingNumber}</td>
                          <td className="border border-gray-300 px-4 py-2">{remain}</td>
                          {installmentAmounts}
                        </tr>
                      );
                    }
                    return null;
                  })}
                </tbody>
              </table>
            </div> */}
            <div className="px-4 mb-4">
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              >
                Download PDF
              </button>
            </div>
          </>
        )}
      </div>

      <div className="overflow-x-auto">
        <h1
          className="text-xl px-4 text-red-500 font-mono font-bold mb-4 text-start cursor-pointer flex items-center"
          onClick={toggleExpansion1}
        >
          <span className="mr-2">
            {expanded1 ? <FaChevronUp /> : <FaChevronDown />}
          </span>
          2.  Transaction Record
        </h1>
        {expanded1 && <TransactionRecords />}
      </div>
    </div>
  );
};

export default TransactionRecord;
