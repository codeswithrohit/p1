import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';

const Summary = ({ userdata }) => {
  const [studentData, setStudentData] = useState([]);
  const [filteredData, setFilteredData] = useState({ result: [], totalCollection: { totalCash: 0, totalOnline: 0 } });
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const defaultDate = now.toISOString().slice(0, 10); // Default date (YYYY-MM-DD)
  const defaultTime = now.toISOString().slice(11, 16); // Default time (HH:MM)

  const [startDate, setStartDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultTime);
  const [endDate, setEndDate] = useState(defaultDate);
  const [endTime, setEndTime] = useState(defaultTime);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = firebase.firestore();
        const docRef = db.collection('registrations');
        const snapshot = await docRef.get();

        if (!snapshot.empty) {
          let data = [];
          snapshot.forEach((doc) => {
            const student = doc.data();

            // Filter subjects based on the required conditions
            const filteredSubjects = student.subjects?.map((subject) => {
              const filteredColumns = subject.columns?.filter((column) => {
                const [day, month, yearTime] = column.date.split('/');
                const [year, time] = yearTime.split(' ');
                const formattedDate = new Date(`${year}-${month}-${day}T${time}`);

                // Construct start and end datetime objects
                const startDateTime = new Date(`${startDate}T${startTime}`);
                const endDateTime = new Date(`${endDate}T${endTime}`);

                // Check if the date and time are within the selected range and if the received name matches the userdata name
                const isWithinRange = formattedDate >= startDateTime && formattedDate <= endDateTime;
                return column.received === userdata[0].name && !isNaN(formattedDate.getTime()) && isWithinRange;
              });

              return filteredColumns?.length > 0
                ? { ...subject, columns: filteredColumns }
                : null;
            }).filter(subject => subject !== null); // Remove null entries

            // Add student to data if there are any filtered subjects with valid columns
            if (filteredSubjects?.length > 0) {
              data.push({
                ...student,
                subjects: filteredSubjects,
              });
            }
          });

          setStudentData(data);
        } else {
          console.log('No documents in the collection!');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error getting documents:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [userdata, startDate, startTime, endDate, endTime]);

  useEffect(() => {
    // Filter data when studentData changes
    if (studentData.length > 0) {
      const result = studentData.flatMap(student => 
        student.subjects.flatMap(subject => 
          subject.columns.map(column => ({
            subjectName: subject.subjectName,
            amount: column.amount,
            date: column.date,
            mode: column.mode,
          }))
        )
      );

      const totalCollection = result.reduce((acc, curr) => {
        if (curr.mode === 'Cash') {
          acc.totalCash += parseFloat(curr.amount);
        } else if (curr.mode === 'Online') {
          acc.totalOnline += parseFloat(curr.amount);
        }
        return acc;
      }, { totalCash: 0, totalOnline: 0 });

      setFilteredData({
        result,
        totalCollection
      });

      // Log filteredData to see the structure
      console.log('filteredData', {
        result: result,
        totalCollection: totalCollection
      });
    } else {
      setFilteredData({ result: [], totalCollection: { totalCash: 0, totalOnline: 0 } });
    }
  }, [studentData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='min-h-screen bg-white'>
      <div className="bg-gradient-to-b from-sky-400 to-white">
        <h1 className="text-xl font-bold mb-4 font-mono text-center">Subject Wise Summary</h1>
      </div>
      
      <div className='p-6'>

        <div className='flex gap-8' >
        {/* <div className="mb-4">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full"
          />
        </div> */}

        <div className="mb-4">
          <label htmlFor="start-time" className="block text-sm font-mono font-medium text-gray-700">Start Time</label>
          <input
            type="time"
            id="start-time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 block w-full font-mono"
          />
        </div>
{/* 
        <div className="mb-4">
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full"
          />
        </div> */}

        <div className="mb-4">
          <label htmlFor="end-time" className="block text-sm font-mono font-medium text-gray-700">End Time</label>
          <input
            type="time"
            id="end-time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 block w-full font-mono"
          />
        </div>
        </div>
        <div className="mb-4 flex flex-col ">
          <h1 className='font-bold font-mono' >Total Collection in Cash: {filteredData.totalCollection.totalCash}</h1>
          <h1 className='font-bold font-mono' >Total Collection in Online: {filteredData.totalCollection.totalOnline}</h1>
        </div>

        <table className="min-w-full bg-white border border-gray-800">
          <thead>
            <tr>
              <th className="border-b px-4 py-2 text-left text-sm font-semibold font-mono border-gray-800 text-center font-mono">Subject Name</th>
              <th className="border-b px-4 py-2 text-left text-sm font-semibold font-mono border-gray-800 text-center font-mono">Cash Received</th>
              <th className="border-b px-4 py-2 text-left text-sm font-semibold font-mono border-gray-800 text-center font-mono">Online Payment</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.result.map((data, index) => (
              <tr key={index}>
                <td className="border-b border-gray-800 px-4 py-2 text-sm text-center font-mono">{data.subjectName}</td>
                <td className="border-b border-gray-800 px-4 py-2 text-sm text-center font-mono">₹{data.mode === 'Cash' ? data.amount : '0'}</td>
                <td className="border-b border-gray-800 px-4 py-2 text-sm text-center font-mono">₹{data.mode === 'Online' ? data.amount : '0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Summary;
