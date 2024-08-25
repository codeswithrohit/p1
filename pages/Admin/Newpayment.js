import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const db = firebase.firestore();

const Newpayment = ({ userdata }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjectColumns, setSubjectColumns] = useState([]);
  const [registrationData, setRegistrationData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    const id = router.query.id;
    if (id && !isNaN(id) && Number(id) > 0) {
      const docRef = db.collection('registrations').where("id", "==", Number(id));
      docRef
        .get()
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            setRegistrationData(doc.data());
            const formatDate = (date) => {
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
              const year = date.getFullYear();
              
              return `${day}/${month}/${year}`;
            };
            
            const formatTime = (date) => {
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              const seconds = String(date.getSeconds()).padStart(2, '0');
              
              return `${hours}:${minutes}:${seconds}`;
            };
            
            const now = new Date();
            const formattedDate = formatDate(now);
            const formattedTime = formatTime(now);
            
            const currentDateTime = `${formattedDate} ${formattedTime}`;

            const receivedName = userdata && userdata.length > 0 ? userdata[0].name : '';
            const initialColumns = doc.data().subjects.map(() => {
              return { columns: [{ date: currentDateTime, amount: '', mode: '', received: receivedName }] };
            });
            setSubjectColumns(initialColumns);
            setLoading(false);
          } else {
            console.log('No such document!');
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error('Error getting document:', error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [router.query.id, userdata]);

  const handleColumnChange = (e, subjectIndex, columnIndex, field) => {
    const newSubjectColumns = [...subjectColumns];
    newSubjectColumns[subjectIndex].columns[columnIndex][field] = e.target.value;
    setSubjectColumns(newSubjectColumns);
  };

  const handleSaveData = () => {
    if (window.confirm('Are you sure you want to submit the payment details?')) {
      const updatedRegistrationData = { ...registrationData };
  
      updatedRegistrationData.subjects.forEach((subject, subjectIndex) => {
        const columns = subjectColumns[subjectIndex]?.columns || [];
        const nonEmptyColumns = columns.filter((column) => {
          return column.date?.trim() && column.amount?.trim() && column.mode?.trim();
        });
  
        if (!Array.isArray(subject.columns)) {
          subject.columns = [];
        }
  
        subject.columns.push(...nonEmptyColumns);
      });
  
      const cleanedRegistrationData = JSON.parse(JSON.stringify(updatedRegistrationData));
  
      const id = router.query.id;
      const docRef = db.collection('registrations').where("id", "==", Number(id));
  
      docRef
        .get()
        .then((querySnapshot) => {
          const doc = querySnapshot.docs[0];
          return doc.ref.update(cleanedRegistrationData);
        })
        .then(() => {
          // Reset columns to empty for new data entry
          const initialColumns = registrationData.subjects.map(() => {
            return { columns: [{ date: '', amount: '', mode: '', received: '' }] };
          });
          setSubjectColumns(initialColumns);
          toast.success('Data saved successfully!');
          
          // Set only the latest submitted data for the popup
          const latestData = registrationData.subjects.map((subject, index) => ({
            ...subject,
            columns: subject.columns.slice(-subjectColumns[index].columns.length),
          }));
          setSubmittedData({ subjects: latestData });
          setShowPopup(true); // Show the popup with data
        })
        .catch((error) => {
          toast.error('Error saving data: ' + error.message);
        });
    }
  };

  if (loading) return <p>Loading...</p>;
  
  return (
    <div className='bg-white min-h-screen'>
      <div className=''>
        <h1 className="text-sm px-8 py-4 font-bold mb-4">
          Student Name: {registrationData?.firstName} {registrationData?.middleName} {registrationData?.lastName}
        </h1>

        <div className="mb-8">
          <table className="w-96 border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border text-sm border-gray-300 px-4 py-2">Subject Name</th>
                <th className="border text-sm border-gray-300 px-4 py-2">Remain Fees</th>
                <th className="border text-sm border-gray-300 px-4 py-2">Pay In</th>
                <th className="border text-sm border-gray-300 px-4 py-2">Mode of Payment</th>
              </tr>
            </thead>
            <tbody>
              {registrationData && registrationData.subjects ? (
                registrationData.subjects.map((subject, index) => (
                  <React.Fragment key={index}>
                    {subjectColumns[index]?.columns?.map((column, columnIndex) => {
                      const totalPaid = Array.isArray(subject.columns) ? subject.columns.reduce((total, col) => total + parseFloat(col.amount || 0), 0) : 0;
                      const remainingFees = parseFloat(subject.totalFees) - totalPaid;

                      return (
                        <tr key={columnIndex}>
                          <td className="border border-gray-300 px-4 py-2">
                            <p>{subject.subjectName}</p>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <p>{remainingFees}</p>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {columnIndex === subjectColumns[index].columns.length - 1 ? (
                              <input
                                type="text"
                                value={column.amount}
                                onChange={(e) => handleColumnChange(e, index, columnIndex, 'amount')}
                                className="w-full rounded border border-gray-400 px-2 py-1 focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <p>{column.amount}</p>
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {columnIndex === subjectColumns[index].columns.length - 1 ? (
                              <select
                                value={column.mode}
                                onChange={(e) => handleColumnChange(e, index, columnIndex, 'mode')}
                                className="w-full rounded border border-gray-400 px-2 py-1 focus:outline-none focus:border-blue-500"
                              >
                                <option value="" disabled>Select mode</option>
                                <option value="Online">Online</option>
                                <option value="Cash">Cash</option>
                              </select>
                            ) : (
                              <p>{column.mode}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="border border-gray-300 px-4 py-2 text-center">No subjects available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center">
          <button
            className="bg-blue-500 w-28 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
            onClick={handleSaveData}
          >
            OK
          </button>
        </div>

        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
              <h2 className="text-lg font-bold mb-2">Submitted Fees Data</h2>
              <p>Student Name: {registrationData?.firstName} {registrationData?.middleName} {registrationData?.lastName}</p>
              {submittedData?.subjects?.map((subject, index) => (
                <div key={index} className="mb-4">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border text-sm border-gray-300 px-4 py-2">Subject Name</th>
                        <th className="border text-sm border-gray-300 px-4 py-2">Pay In</th>
                        <th className="border text-sm border-gray-300 px-4 py-2">Mode of Payment</th>
                        <th className="border text-sm border-gray-300 px-4 py-2">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subject.columns.map((column, colIndex) => (
                        <tr key={colIndex}>
                          <td className="border border-gray-300 px-4 py-2">
                            <p>{subject.subjectName}</p>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <p>{column.amount}</p>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <p>{column.mode}</p>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <p>{column.date}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <button
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Newpayment;
