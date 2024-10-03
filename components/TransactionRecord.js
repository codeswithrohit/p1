import React, { useState, useEffect } from 'react';
import { firebase } from '../Firebase/config';
import moment from 'moment';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;
const TransactionRecordPage = () => {
  const [selectedSubjects, setSelectedSubjects] = useState([]);
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
  const handleSubjectChange = (subjectName) => {
    setSelectedSubjects((prevSelected) =>
      prevSelected.includes(subjectName)
        ? prevSelected.filter((subject) => subject !== subjectName)
        : [...prevSelected, subjectName]
    );
  };

  useEffect(() => {
    const filterData = () => {
      let data = registrationData;

      // Filter by selected subject
      if (selectedSubjects.length > 0) {
        data = data.map((student) => ({
          ...student,
          subjects: student.subjects.filter((subject) => selectedSubjects.includes(subject.subjectName)),
        })).filter((student) => student.subjects.length > 0);
      }

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

      // Filter by date range
      if (fromDateTime && toDateTime) {
        const fromDate = moment(fromDateTime, 'YYYY-MM-DDTHH:mm').toDate();
        const toDate = moment(toDateTime, 'YYYY-MM-DDTHH:mm').toDate();

        data = data.map((student) => ({
          ...student,
          subjects: student.subjects.map((subject) => ({
            ...subject,
            columns: subject.columns ? subject.columns.filter((column) => {
              const columnDate = moment(column.date, 'DD/MM/YYYY HH:mm:ss').toDate();
              return columnDate >= fromDate && columnDate <= toDate;
            }) : [],
          })).filter((subject) => subject.columns.length > 0),
        })).filter((student) => student.subjects.length > 0);
      }

      // Sort subjects by the newest column date first
      data = data.map((student) => ({
        ...student,
        subjects: student.subjects.map((subject) => ({
          ...subject,
          columns: subject.columns
            ? subject.columns.sort((a, b) => moment(b.date, 'DD/MM/YYYY HH:mm:ss').toDate() - moment(a.date, 'DD/MM/YYYY HH:mm:ss').toDate())
            : [],
        }))
      }));

      // Sort the whole data array by the newest column date (if available)
      data = data.sort((a, b) => {
        const latestA = a.subjects[0]?.columns[0]?.date ? moment(a.subjects[0].columns[0].date, 'DD/MM/YYYY HH:mm:ss').toDate() : new Date(0);
        const latestB = b.subjects[0]?.columns[0]?.date ? moment(b.subjects[0].columns[0].date, 'DD/MM/YYYY HH:mm:ss').toDate() : new Date(0);
        return latestB - latestA;
      });

      const receivedTotals = {};
      data.forEach((student) => {
        student.subjects.forEach((subject) => {
          if (subject.columns && Array.isArray(subject.columns)) {
            subject.columns.forEach((column) => {
              if (!receivedTotals[column.received]) {
                receivedTotals[column.received] = { Cash: 0, Online: 0, Total: 0 };
              }
              receivedTotals[column.received][column.mode] += parseFloat(column.amount);
              receivedTotals[column.received].Total += parseFloat(column.amount);
            });
          }
        });
      });

      setReceivedTotals(receivedTotals);
      setFilteredData(data);
      setIsDataVisible(data.length > 0);

      const calculateTotalCollection = (data, mode) => {
        return data.reduce((total, student) => {
          student.subjects.forEach((subject) => {
            if (subject.columns) {
              const payments = mode === 'All'
                ? subject.columns
                : subject.columns.filter((column) => column.mode === mode);
              const totalAmount = payments.reduce((acc, column) => acc + parseFloat(column.amount || 0), 0);
              total += totalAmount;
            }
          });
          return total;
        }, 0);
      };

      let totalOnline = calculateTotalCollection(data, 'Online');
      let totalOffline = calculateTotalCollection(data, 'Cash');
      const totalBalance = totalOnline + totalOffline;

      setTotalCollectionOnline(totalOnline);
      setTotalCollectionOffline(totalOffline);
      setRemainingBalance(totalBalance);
    };

    const data = filterData();
  }, [selectedSubject, selectedSubjects, selectedMode, registrationData, fromDateTime, toDateTime]);


  const downloadPdf = () => {
    // Get the current date and time to include in the file name
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(currentDate.getHours()).padStart(2, '0')}-${String(currentDate.getMinutes()).padStart(2, '0')}`;
    const fileName = `Transaction_Record_${formattedDate}_${formattedTime}.pdf`;
  
    const docDefinition = {
      pageMargins: [40, 60, 40, 60], // Added margins for better layout
      content: [
        {
          text: `Account Statement From ${fromDateTime} to ${toDateTime}`,
          style: 'header',
        },
        {
          columns: [
            {
              width: '50%',
              text: `Total Collection Cash: ₹${totalCollectionOffline}`,
              margin: [0, 10, 0, 10], // Added margin for spacing
            },
            {
              width: '50%',
              text: `Total Collection Online: ₹${totalCollectionOnline}`,
              margin: [0, 10, 0, 10], // Added margin for spacing
            },
          ],
        },
        {
          table: {
            headerRows: 1,
            widths: ['20%', '20%', '16%', '20%', '10%', '16%'],
            body: [
              [
                { text: 'Date and Time', bold: true, fillColor: '#f3f3f3', margin: [0, 5, 0, 5] },
                { text: 'Student Name', bold: true, fillColor: '#f3f3f3', margin: [0, 5, 0, 5] },
                { text: 'Subject', bold: true, fillColor: '#f3f3f3', margin: [0, 5, 0, 5] },
                { text: 'Payment Mode',fontSize:12, bold: true, fillColor: '#f3f3f3', margin: [0, 5, 0, 5] },
                { text: 'Amount', bold: true, fillColor: '#f3f3f3', margin: [0, 5, 0, 5] },
                { text: 'Received By', bold: true, fillColor: '#f3f3f3', margin: [0, 5, 0, 5] },
              ],
              ...filteredData.flatMap((student) =>
                student.subjects.flatMap((subject) =>
                  (subject.columns || []).map((column) => [
                    { text: column.date, margin: [0, 2, 0, 2] },
                    { text: `${student.firstName} ${student.middleName} ${student.lastName}`, margin: [0, 2, 0, 2] },
                    { text: subject.subjectName, margin: [0, 2, 0, 2] },
                    { text: column.mode, margin: [0, 2, 0, 2] },
                    { text: `₹${column.amount}`, margin: [0, 2, 0, 2] },
                    { text: column.received, margin: [0, 2, 0, 2] },
                  ])
                )
              ),
            ],
            margin: [0, 10, 0, 10], // Margin around the table
          },
        },
        {
          text: `Total Collection: ₹${remainingBalance}`,
          margin: [0, 20, 0, 0],
          bold: true,
          alignment: 'right', // Align to the right for better presentation
        },
        {
          text: 'Received Totals By User:',
          style: 'subheader',
          margin: [0, 10, 0, 5],
        },
        ...Object.entries(receivedTotals).map(([recipient, totals]) => ({
          text: `${recipient}: Cash: ₹${totals.Cash}, Online: ₹${totals.Online}, Total: ₹${totals.Total}`,
          margin: [0, 5, 0, 5], // Margin for spacing between lines
        })),
      ],
      styles: {
        header: {
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 20], // Top margin for spacing after header
          alignment: 'center', // Center align header text
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 10],
        },
      },
    };
  
    // Download the PDF with the dynamic filename
    pdfMake.createPdf(docDefinition).download(fileName);
  };
  
  
  

  return (
    <div className="flex min-h-screen bg-white dark:bg-white">
      <div  className="p-8 overflow-x-auto">
        <div className='flex gap-4' >
        <div className="mb-4">
            {/* Multi-select for Subjects */}
            <div className="border border-gray-300 rounded px-4 py-2">
              <div>Select Subjects:</div>
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.name)}
                    onChange={() => handleSubjectChange(subject.name)}
                    className="mr-2"
                  />
                  <label>{subject.name}</label>
                </div>
              ))}
            </div>
          </div>

        <div className="mb-4">
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

        {/* {isDataVisible && (
          <>
             <div   className='  mb-20' >

<div className='' >
              <div  >
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
            <h1 className="font-bold font-mono text-sm mb-4 text-black">Received Totals By User:</h1>
            <div className="mt-4">
          {Object.entries(receivedTotals).map(([recipient, totals]) => (
            <div key={recipient} className="mb-2">
              <p><strong>{recipient}:</strong></p>
              <p>Cash: {totals.Cash}</p>
              <p>Online: {totals.Online}</p>
              <p>Total: {totals.Total}</p>
            </div>
          ))}
        </div>
          <h2 className="font-semibold mb-2 mr-4">Total Collection:</h2>
          <p className="border border-gray-300 rounded p-2">{remainingBalance}</p>
        </div>
        </div>
        </div>
        <button  onClick={downloadPdf}
  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
>
  Download PDF
</button>

            
          </div>
          </>
        )} */}
          <button  onClick={downloadPdf}
  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
>
  Download PDF
</button>
      </div>
    </div>
  );
};

export default TransactionRecordPage;
