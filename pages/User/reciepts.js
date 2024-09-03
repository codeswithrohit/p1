import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';

const Reciepts = ({ userdata }) => {
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = firebase.firestore();
        const docRef = db.collection('registrations');
        const snapshot = await docRef.get();

        if (!snapshot.empty) {
          // Get today's date in DD/MM/YYYY format
          const today = new Date();
          const formattedToday = today.toISOString().split('T')[0].split('-').reverse().join('/');

          let data = [];
          snapshot.forEach((doc) => {
            const student = doc.data();

            // Filter subjects based on the required conditions
            const filteredSubjects = student.subjects?.map((subject) => {
              const filteredColumns = subject.columns?.filter((column) => {
                const [day, month, yearTime] = column.date.split('/');
                const [year, time] = yearTime.split(' ');
                const formattedDate = new Date(`${year}-${month}-${day}T${time}`);

                // Check if the date is valid, if the date matches today, and if the received name matches the userdata name
                return column.received === userdata[0].name && formattedToday === `${day}/${month}/${year}`;
              });

              // Sort the filtered columns by date in descending order
              const sortedColumns = filteredColumns?.sort((a, b) => {
                const [aDay, aMonth, aYearTime] = a.date.split('/');
                const [aYear, aTime] = aYearTime.split(' ');
                const aDate = new Date(`${aYear}-${aMonth}-${aDay}T${aTime}`);

                const [bDay, bMonth, bYearTime] = b.date.split('/');
                const [bYear, bTime] = bYearTime.split(' ');
                const bDate = new Date(`${bYear}-${bMonth}-${bDay}T${bTime}`);

                return bDate - aDate; // Sort in descending order
              });

              return sortedColumns?.length > 0
                ? { ...subject, columns: sortedColumns }
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
  }, [userdata]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='min-h-screen bg-white'>
      <div className="bg-gradient-to-b from-sky-400 to-white">
        <h1 className="text-xl font-semibold mb-4 text-center">Receipts</h1>
      </div>
      <div className='p-6 mb-20'>
        <div className="bg-white p-2 border border-black w-full">
          {studentData.length > 0 ? (
            studentData.map((student, studentIndex) => (
              <div key={studentIndex} className=" p-4 border-b border-gray-600" >
                <h1 className="font-mono font-bold">
                  Student Name: {student.firstName} {student.middleName} {student.lastName}
                </h1>
                {student.subjects.map((subject, subjectIndex) =>
                  subject.columns.map((column, columnIndex) => (
                    <div key={`${subjectIndex}-${columnIndex}`}>
                      <h1 className="font-mono font-bold mb-2">Date & Time: {column.date}</h1>
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border text-sm border-gray-300 px-4 py-2 text-center">Subject Name</th>
                            <th className="border text-sm border-gray-300 px-4 py-2 text-center">Pay In</th>
                            <th className="border text-sm border-gray-300 px-4 py-2 text-center">Mode of Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 text-black px-4 py-2 font-mono text-center">{subject.subjectName}</td>
                            <td className="border border-gray-300 text-black px-4 py-2 font-mono text-center">₹{column.amount}</td>
                            <td className="border border-gray-300 text-black px-4 py-2 font-mono text-center">{column.mode}</td>
                          </tr>
                        </tbody>
                      </table>
                      <h1 className="font-mono font-bold mb-2 text-black mt-2">
                        Received By: {column.received}
                      </h1>
                    </div>
                  ))
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 font-mono font-bold">
              No Data Available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reciepts;
