import React, { useState, useEffect } from 'react';
import { firebase } from '../Firebase/config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import moment from 'moment';

const TransactionRecordPage = () => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedMode, setSelectedMode] = useState('');
  const [registrationData, setRegistrationData] = useState([]);
  const [totalCollectionOnline, setTotalCollectionOnline] = useState(0);
  const [totalCollectionOffline, setTotalCollectionOffline] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [fromDateTime, setFromDateTime] = useState('');
  const [toDateTime, setToDateTime] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isDataVisible, setIsDataVisible] = useState(false);
  const [receivedTotals, setReceivedTotals] = useState({});
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const db = firebase.firestore();
        const subjectsSnapshot = await db.collection('subjects').get();
        const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setSubjects(subjects);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchRegistrationData = async () => {
      try {
        const db = firebase.firestore();
        const docRef = db.collection('registrations');
        const snapshot = await docRef.get();
        const allRegistrationData = [];
        snapshot.forEach((doc) => {
          allRegistrationData.push(doc.data());
        });
        setRegistrationData(allRegistrationData);
      } catch (error) {
        console.error('Error getting documents:', error);
      }
    };

    fetchRegistrationData();
  }, []);

  useEffect(() => {
    const filterData = () => {
      let data = registrationData;

      // Log initial registration data
      console.log('Initial Registration Data:', data);

      // Filter by selected subject
      if (selectedSubject) {
        data = data.map((student) => ({
          ...student,
          subjects: student.subjects.filter((subject) => subject.subjectName === selectedSubject),
        })).filter((student) => student.subjects.length > 0);
      }

      // Log data after subject filtering
      console.log('Data After Subject Filtering:', data);

      // Filter by selected mode
      if (selectedMode && selectedMode !== 'All') {
        data = data.map((student) => ({
          ...student,
          subjects: student.subjects.map((subject) => ({
            ...subject,
            columns: subject.columns ? subject.columns.filter((column) => column.mode === selectedMode) : [],
          })).filter((subject) => subject.columns.length > 0),
        })).filter((student) => student.subjects.length > 0);
      }

      // Log data after mode filtering
      console.log('Data After Mode Filtering:', data);

      // Filter by date range
      if (fromDateTime && toDateTime) {
        const fromDate = moment(fromDateTime, 'YYYY-MM-DDTHH:mm').toDate();
        const toDate = moment(toDateTime, 'YYYY-MM-DDTHH:mm').toDate();

        // Log selected date range
        console.log('Selected Date Range:', {
          fromDate: moment(fromDate).format('DD/MM/YYYY HH:mm:ss'),
          toDate: moment(toDate).format('DD/MM/YYYY HH:mm:ss')
        });

        data = data.map((student) => ({
          ...student,
          subjects: student.subjects.map((subject) => ({
            ...subject,
            columns: subject.columns ? subject.columns.filter((column) => {
              const columnDate = moment(column.date, 'DD/MM/YYYY HH:mm:ss').toDate();

              // Log each column date and its comparison result
              console.log('Column Date:', moment(column.date, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY HH:mm:ss'));
              console.log('Is Column Date Within Range:', columnDate >= fromDate && columnDate <= toDate);

              return columnDate >= fromDate && columnDate <= toDate;
            }) : [],
          })).filter((subject) => subject.columns.length > 0),
        })).filter((student) => student.subjects.length > 0);

        // Log data after date range filtering
        console.log('Data After Date Range Filtering:', data);
      }


      const receivedTotals = {};
      data.forEach((student) => {
        student.subjects.forEach((subject) => {
          if (subject.columns && Array.isArray(subject.columns)) {
            subject.columns.forEach((column) => {
              if (receivedTotals[column.received]) {
                receivedTotals[column.received] += parseFloat(column.amount);
              } else {
                receivedTotals[column.received] = parseFloat(column.amount);
              }
            });
          }
        });
      });

      setReceivedTotals(receivedTotals);
      
      console.log('Filtered Data:', data);
      console.log('Received Totals:', receivedTotals);

      console.log('Filtered Data:', data); // Log the filtered data to the console

      return data;
    };

    const data = filterData();
    setFilteredData(data);
    setIsDataVisible(data.length > 0);

    const calculateTotalCollection = (data, mode) => {
      return data.reduce((total, student) => {
        const subjectData = student.subjects?.find((subject) => subject.subjectName === selectedSubject);
        if (subjectData && subjectData.columns) {
          const payments = mode === 'All'
            ? subjectData.columns
            : subjectData.columns.filter((column) => column.mode === mode);
          const totalAmount = payments.reduce((acc, column) => acc + parseFloat(column.amount || 0), 0);
          return total + totalAmount;
        }
        return total;
      }, 0);
    };

    let totalOnline = 0;
    let totalOffline = 0;

    if (selectedMode === 'All' || selectedMode === '') {
      totalOnline = calculateTotalCollection(data, 'Online');
      totalOffline = calculateTotalCollection(data, 'Cash');
    } else {
      totalOnline = calculateTotalCollection(data, 'Online');
      totalOffline = calculateTotalCollection(data, 'Cash');
    }

    const totalBalance = totalOnline + totalOffline;

    setTotalCollectionOnline(totalOnline);
    setTotalCollectionOffline(totalOffline);
    setRemainingBalance(totalBalance);
  }, [selectedSubject, selectedMode, registrationData, fromDateTime, toDateTime]);


  const downloadPDF = () => {
    const input = document.getElementById('pdfTable2');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width; // Calculate height to maintain aspect ratio

      // Check if the content height fits within one page
      const pageHeight = 295; // A4 height in mm
      if (imgHeight <= pageHeight) {
        // Add the image to a single page
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Scale down the image to fit within one page
        const scale = pageHeight / imgHeight;
        const newImgWidth = imgWidth * scale;
        const newImgHeight = imgHeight * scale;

        // Add the scaled image to the page
        pdf.addImage(imgData, 'PNG', 0, 0, newImgWidth, newImgHeight);
      }

      const now = moment().format('DD/MM/YYYY HH:mm:ss');
      const fileName = `transaction-record-${now}.pdf`;

      pdf.save(fileName);
    });
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-white">
      <div  className="p-8 overflow-x-auto">
        <div className='flex gap-4' >
        <div className="mb-4">
          <label className="block mb-2" htmlFor="subjectSelect">
            Select Subject:
          </label>
          <select
            id="subjectSelect"
            className="border border-gray-300 rounded px-4 py-2"
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

        <div className="mb-4">
          <label className="block mb-2" htmlFor="modeSelect">
            Select Mode:
          </label>
          <select
            id="modeSelect"
            className="border border-gray-300 rounded px-4 py-2"
            onChange={(e) => setSelectedMode(e.target.value)}
            value={selectedMode}
          >
            <option value="">Select a Mode</option>
            <option value="All">All</option>
            <option value="Online">Online</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
        </div>
        <div className='flex gap-4' >
        <div className="mb-4">
          <label className="block mb-2">From Date & Time:</label>
          <input
            type="datetime-local"
            className="border w-44 border-gray-300 rounded px-4 py-2"
            onChange={(e) => {
              setFromDateTime(e.target.value);
              console.log('From Date & Time Selected:', e.target.value);
            }}
            value={fromDateTime}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">To Date & Time:</label>
          <input
            type="datetime-local"
            className="border w-44 border-gray-300 rounded px-4 py-2"
            onChange={(e) => {
              setToDateTime(e.target.value);
              console.log('To Date & Time Selected:', e.target.value);
            }}
            value={toDateTime}
          />
        </div>
        </div>

        {isDataVisible && (
          <>
             <div className='mb-20' >

              <div id="pdfTable2" >
            <h1 className='font-bold font-mono text-sm mb-4 text-black' >Account Statement From {fromDateTime} to {toDateTime} </h1>
            <div className="flex mb-4">
          <div className="flex-1">
            <h2 className="font-semibold mb-2 mr-4">Total Collection Cash:</h2>
            <p className="border border-gray-300 rounded p-2">{totalCollectionOffline}</p>
          </div>
          <div className="flex-1 ml-4">
            <h2 className="font-semibold mb-2">Total Collection Online:</h2>
            <p className="border border-gray-300 rounded p-2">{totalCollectionOnline}</p>
          </div>
        </div>
            <div  className="mt-4">
            <div className="overflow-x-auto">
<table className="min-w-full border border-gray-300">
  <thead>
    <tr>
      <th className="border border-gray-300 px-1 text-[10px] py-1 ">Date and Time</th>
      <th className="border border-gray-300 px-1 text-[10px] py-1 ">Student Name</th>
      <th className="border border-gray-300 px-1 text-[10px] py-1 ">Subject</th>
      <th className="border border-gray-300 px-1 text-[10px] py-1 ">Mode of Payment</th>
      <th className="border border-gray-300 px-1 text-[10px] py-1 ">Amount</th>
      <th className="border border-gray-300 px-1 text-[10px] py-1 ">Received By</th>
    </tr>
  </thead>
  <tbody>
  {filteredData.map((student, index) => (
    student.subjects?.map((subject) => (
      subject.columns?.map((column, colIndex) => (
        <tr key={`${index}-${colIndex}`}>
          <td className="border border-gray-300 px-1 py-1 text-[12px] font-semibold font-mono">{column.date}</td>
          <td className="border border-gray-300 px-1 py-1 text-[12px] font-semibold font-mono">
            {student.firstName} {student.middleName} {student.lastName}
          </td>
          <td className="border border-gray-300 px-1 py-1 text-[12px] font-semibold font-mono">{subject.subjectName}</td>
          <td className="border border-gray-300 px-1 py-1 text-[12px] font-semiold font-mono">{column.mode}</td>
          <td className="border border-gray-300 px-1 py-1 text-[12px] font-semibold font-mono">₹{column.amount}</td>
          <td className="border border-gray-300 px-1 py-1 text-[12px] font-semibold font-mono">{column.received}</td>
        </tr>
      ))
    ))
  ))}
</tbody>

</table>
</div>

            </div>
            <div className="flex-1 mt-2">
            <h1 className="font-bold font-mono text-sm mb-4 text-black">Received Totals:</h1>
            <ul className="list-disc ml-5">
              {Object.entries(receivedTotals).map(([receivedBy, totalAmount], index) => (
                <li key={index} className="font-mono text-xs text-black">
                  {receivedBy}: ₹{totalAmount}
                </li>
              ))}
            </ul>
          <h2 className="font-semibold mb-2 mr-4">Total Collection:</h2>
          <p className="border border-gray-300 rounded p-2">{remainingBalance}</p>
        </div>
        </div>

            <button
              onClick={downloadPDF}
              className="bg-blue-500 mt-8 text-white px-4 py-2 rounded"
            >
              Download PDF
            </button>

            
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionRecordPage;
