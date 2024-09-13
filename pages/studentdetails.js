import React, { useState, useEffect } from 'react';
import { firebase } from '../Firebase/config';
import { useRouter } from 'next/router';
import { FaAngleDown, FaAngleUp, FaUserEdit, FaQrcode, FaFileAlt, FaCog, FaPlus,FaTrash } from 'react-icons/fa';
import { MdOutlinePayments } from 'react-icons/md';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
const db = firebase.firestore();

const IconWithLabel = ({ icon, label, onClick }) => {
  return (
    <div className="flex flex-col items-center cursor-pointer" onClick={onClick}>
      {icon}
      <span className="text-sm mt-1">{label}</span>
    </div>
  );
};

const Adminregistrattionfooter = ({ onEdit, handleQRCode, handleNewPayment, adminAuthentication, userAuthentication,onDelete }) => {
    return (
      <div className="fixed bottom-12 left-0 right-0 bg-white dark:bg-white p-4 flex justify-around">
        {adminAuthentication && (
          <>
            <IconWithLabel icon={<FaUserEdit size={24} style={{ color: 'blue' }} />} label="Edit" onClick={onEdit} />
            <IconWithLabel icon={<FaQrcode size={24} style={{ color: 'blue' }} />} label="QR Code" onClick={handleQRCode} />
            <IconWithLabel icon={<FaTrash size={24} style={{ color: 'red' }} />} label="Delete" onClick={onDelete} />
          </>
        )}
        {(adminAuthentication || userAuthentication) && (
          <IconWithLabel icon={<MdOutlinePayments size={24} style={{ color: 'blue' }} />} label="New Payment" onClick={handleNewPayment} />
        )}
      </div>
    );
  };
  


  const QRCodeModal = ({ isOpen, onClose, qrCodeUrl, student }) => {
    console.log("Student data:", student);
    console.log("QR Code URL:", qrCodeUrl);

    const downloadImage = () => {
        const input = document.getElementById('pdfTable2');

        if (!input) {
            console.error("Element with ID 'pdfTable2' not found.");
            return;
        }

        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');

            // Create a link element for downloading the image
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `${student?.firstName || 'unknown'}_${student?.id || 'no-id'}.png`;
            link.style.display = 'none'; // Hide the link
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch((error) => {
            console.error("Error capturing screenshot:", error);
        });
    };

    const saveImage = () => {
        const qrCodeImage = document.getElementById('qrCodeImage');

        if (!qrCodeImage) {
            console.error("QR Code image not found.");
            return;
        }

        // Ensure the image is loaded
        qrCodeImage.onload = () => {
            // Create a link element for downloading the image directly
            const link = document.createElement('a');
            link.href = qrCodeImage.src;
            link.download = `${student?.firstName || 'unknown'}_${student?.id || 'no-id'}.png`;
            link.style.display = 'none'; // Hide the link
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        qrCodeImage.onerror = () => {
            console.error("Failed to load QR code image.");
        };

        // Check if the image is already loaded
        if (qrCodeImage.complete) {
            qrCodeImage.onload();
        }
    };

    return isOpen ? (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full">
                <h2 className="text-lg font-bold mb-4">QR Code</h2>
                <div id="pdfTable2" className="flex justify-center mb-4">
                    <img 
                        id="qrCodeImage" 
                        src={qrCodeUrl} 
                        alt="QR Code" 
                        className="w-48 h-48 object-cover" 
                        onError={() => console.error('Failed to load QR code image')}
                    />
                </div  >
                {/* <button
                    onClick={downloadImage}
                    className="bg-blue-500 mt-4 text-white px-4 py-2 rounded"
                >
                    Download QR CODE
                </button> */}
                <button
                    onClick={saveImage}
                    className="bg-green-500 mt-4 text-white px-4 py-2 rounded"
                >
                    Save QR CODE
                </button>
                <button
                    onClick={onClose}
                    className="bg-red-500 ml-8 text-white px-4 py-2  mt-4"
                >
                    Close
                </button>
            </div>
        </div>
    ) : null;
};

  

const StudentDetails = ({adminAuthentication,userAuthentication}) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editPopupVisible, setEditPopupVisible] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [newSubject, setNewSubject] = useState({ subjectName: '', totalFees: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const router = useRouter();
  const { id } = router.query;
  useEffect(() => {
    // Check if both authentications are false and redirect to /serverdown
    if (!adminAuthentication && !userAuthentication) {
      router.push('https://techbabua.com/');
    }
  }, [adminAuthentication, userAuthentication, router]);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (id) {
        try {
          const querySnapshot = await db.collection('registrations').get();

          if (!querySnapshot.empty) {
            const studentData = querySnapshot.docs
              .map(doc => doc.data())
              .find(student => student.id === Number(id));

            setStudent(studentData || null);
            setStudentData(studentData || null);
          } else {
            console.error('No student documents found!');
            setStudent(null);
          }
        } catch (error) {
          console.error('Error fetching student details:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStudentDetails();
  }, [id]);

  useEffect(() => {
    // Fetch subjects, colleges, and branches from Firestore
    const fetchData = async () => {
        try {
            const db = firebase.firestore();

            const subjectsSnapshot = await db.collection('subjects').get();
            const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setSubjects(subjects);

            const collegesSnapshot = await db.collection('colleges').get();
            const colleges = collegesSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setColleges(colleges);

            const branchesSnapshot = await db.collection('branches').get();
            const branches = branchesSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setBranches(branches);
        } catch (error) {
            toast.error('Failed to fetch data.');
        }
    };

    fetchData();
}, []);

  const handleEditClick = () => {
    setEditPopupVisible(true);
    setStudentData({ ...student });
  };

  const handleCloseEditPopup = () => {
    setEditPopupVisible(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudentData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubjectChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSubjects = [...studentData.subjects];
    updatedSubjects[index][name] = value;
    setStudentData(prevState => ({
      ...prevState,
      subjects: updatedSubjects,
    }));
  };

  const handleAddSubject = () => {
    setStudentData(prevState => ({
      ...prevState,
      subjects: [...prevState.subjects, newSubject],
    }));
    setNewSubject({ subjectName: '', totalFees: '' });
  };
  const handleRemoveSubject = (index) => {
    const updatedSubjects = [...studentData.subjects];
    updatedSubjects.splice(index, 1);
    setStudentData(prevState => ({
      ...prevState,
      subjects: updatedSubjects,
    }));
  };

  const handleSubmitEdit = async () => {
    setIsSaving(true); // Set saving state to true
    try {
      const querySnapshot = await db.collection('registrations')
        .where('id', '==', Number(id))
        .get();
  
      if (querySnapshot.empty) {
        toast.error('No student found with the specified ID');
        return;
      }
  
      const doc = querySnapshot.docs[0];
      const docRef = doc.ref;
  
      await docRef.update(studentData);
  
      toast.success('Student details updated successfully!');
      
      setEditPopupVisible(false);
      setStudent(studentData);
    } catch (error) {
      toast.error('Error updating student details');
      console.error('Error updating student details:', error);
    } finally {
      setIsSaving(false); // Set saving state to false
    }
  };


  
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  const [showPaymentdetails, setShowPaymentdetails] = useState(false);


  const togglePersonalDetails = () => {
    setShowPersonalDetails(!showPersonalDetails);
  };

  const togglePaymentDetails = () => {
    setShowPaymentdetails(!showPaymentdetails);
  };

  const handleQRCode = () => {
    if (student && student.qrCodeUrl) {
        setQrCodeUrl(student.qrCodeUrl);
        setIsQRCodeModalOpen(true);
    } else {
        console.log('No QR Code URL found!');
    }
};

  const handleNewPayment = () => {
    // Redirect to the New Payment page using Next.js router
    router.push(`/Newpayment?id=${id}`); // Replace '/Newpayment' with the actual path to your New Payment page
  };


  useEffect(() => {
    // Fetch subjects, colleges, and branches from Firestore
    const fetchData = async () => {
        try {
            const db = firebase.firestore();

            const subjectsSnapshot = await db.collection('subjects').get();
            const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setSubjects(subjects);

        
        } catch (error) {
            toast.error('Failed to fetch data.');
        }
    };

    fetchData();
}, []);


const handleDelete = async () => {
  const confirmed = window.confirm('Are you sure you want to delete this student?');
  if (confirmed) {
    try {
      const querySnapshot = await db.collection('registrations')
        .where('id', '==', Number(id))
        .get();
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        await doc.ref.delete();
        toast.success('Student deleted successfully!');
        router.push('/studentlist');
      } else {
        toast.error('No student found with the specified ID');
      }
    } catch (error) {
      toast.error('Error deleting student');
      console.error('Error deleting student:', error);
    }
  }
};

  if (loading) return <div>Loading...</div>;
  if (!student) return <div>No student details found.</div>;

  return (
    <div className="min-h-screen bg-white p-4  ">
      <div className='mb-60' >
      {/* Student Details */}
      <div className="mb-4">
        <div className="flex justify-center items-center">
          <div className="w-48 h-48 mb-2">
            <img className="w-full h-full object-contain" src={student.imageUrl} alt="student" />
          </div>
        </div>
        <h2 className="text-sm md:text-xl font-mono font-bold mb-2">
          Student Name: {`${student.firstName} ${student.middleName} ${student.lastName}`}
        </h2>
        <table className="w-full border-collapse border border-gray-300">
          <tbody>
            <tr>
              <th className="border border-gray-300 font-bold text-xs p-2 font-mono">Name of Subject</th>
              {student.subjects.map((subject, index) => (
                <td key={index} className="border text-xs font-demibold font-mono border-gray-300 p-2">
                  {subject.subjectName}
                </td>
              ))}
            </tr>
            <tr>
              <th className="border text-xs border-gray-300 p-2 font-mono">Fees</th>
              {student.subjects.map((subject, index) => (
                <td key={index} className="border font-mono font-semibold border-gray-300 p-2">
                  {subject.totalFees}
                </td>
              ))}
            </tr>
            <tr>
              <th className="border border-gray-300 font-mono font-bold text-xs p-2">Paid</th>
              {student.subjects.map((subject, index) => (
                <td key={index} className="border font-mono font-semibold border-gray-300 p-2">
                  {subject.columns && subject.columns.reduce((acc, cur) => {
                    const parsedAmount = parseFloat(cur.amount);
                    return !isNaN(parsedAmount) ? acc + parsedAmount : acc;
                  }, 0) !== 0
                    ? subject.columns.reduce((acc, cur) => {
                        const parsedAmount = parseFloat(cur.amount);
                        return !isNaN(parsedAmount) ? acc + parsedAmount : acc;
                      }, 0)
                    : 0}
                </td>
              ))}
            </tr>
            <tr>
              <th className="border font-mono text-xs font-bold border-gray-300 p-2">Remain</th>
              {student.subjects.map((subject, index) => (
                <td key={index} className="border font-mono font-semibold border-gray-300 p-2">
                  {subject.columns
                    ? parseFloat(subject.totalFees) -
                      (subject.columns.reduce((acc, cur) => {
                        const parsedAmount = parseFloat(cur.amount);
                        return !isNaN(parsedAmount) ? acc + parsedAmount : acc;
                      }, 0) || parseFloat(subject.totalFees))
                    : parseFloat(subject.totalFees)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      
      </div>
      <div className="mb-4 mt-8">
            <button
              type="button"
              onClick={togglePaymentDetails}
              className="text-blue-500 font-mono focus:outline-none flex text-lg font-bold"
            >
              {showPaymentdetails ? <FaAngleUp size={20} className="mt-1" /> : <FaAngleDown size={20} className="mt-1" />}
              {showPaymentdetails ? ' Payment Details' : ' Payment Details'}
            </button>
           
            {showPaymentdetails ? (
  student &&
  student.subjects.map((subject, index) => (
    <div key={index}>
      <h1 className="text-lg font-mono py-2 font-semibold">{subject.subjectName}</h1>
      <table className="w-full border-collapse border border-gray-800">
        <thead>
          <tr>
            <th className="border border-gray-800 p-2 font-mono text-sm">Date & Time</th>
            <th className="border border-gray-800 p-2 font-mono text-sm">Amount</th>
            <th className="border border-gray-800 p-2 font-mono text-sm">Mode of Payment</th>
            <th className="border border-gray-800 p-2 font-mono text-sm">Received</th>
          </tr>
        </thead>
        <tbody>
          {subject.columns && subject.columns.map((column, columnIndex) => (
            <tr key={columnIndex}>
              <td className="border border-gray-600 p-2 font-mono font-semibold">
                <p>{column.date}</p>
              </td>
              <td className="border border-gray-600 p-2 font-mono font-semibold">
                <p>₹{column.amount}</p>
              </td>
              <td className="border border-gray-600 p-2 font-mono font-semibold">
                <p>{column.mode}</p>
              </td>
              <td className="border border-gray-600 p-2 font-mono font-semibold">
                <p>{column.received}</p>
              </td>
            </tr>
          ))}
        
        </tbody>
      </table>
     
    </div>
  ))
) : null}





        
            
          </div>

          <div className="mb-4 mt-8">
            <button
              type="button"
              onClick={togglePersonalDetails}
              className="text-blue-500 focus:outline-none flex text-xl font-bold"
            >
              {showPersonalDetails ? <FaAngleUp size={20} className="mt-1" /> : <FaAngleDown size={20} className="mt-1" />}
              {showPersonalDetails ? ' Personal Details' : ' Personal Details'}
            </button>
            {showPersonalDetails ? (
              <div>
                <p className='font-mono font-semibold' >
                  <strong>College Name:</strong> {student.collegeName}
                </p>
                <p className='font-mono font-semibold' >
                  <strong>Branch:</strong> {student.branch}
                </p>
                <p className='font-mono font-semibold' >
                  <strong>Calling Number:</strong> {student.callingNumber}
                </p>
                <p className='font-mono font-semibold' >
                  <strong>whatsappNumber:</strong> {student.whatsappNumber}
                </p>
                {/* Display other personal details similarly */}
              </div>
            ) : null}
          </div>

      {/* Edit Popup */}
      {editPopupVisible && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Edit Student Details</h2>
            <form>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={studentData.firstName || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={studentData.middleName || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={studentData.lastName || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">College Name</label>
                
                <input
                  type="text"
                  name="collegeName"
                  value={studentData.collegeName || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                <input
                  type="text"
                  name="branch"
                  value={studentData.branch || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Calling Number</label>
                <input
                  type="text"
                  name="callingNumber"
                  value={studentData.callingNumber || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Whatsapp Number</label>
                <input
                  type="text"
                  name="whatsappNumber"
                  value={studentData.whatsappNumber || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                {studentData.subjects && studentData.subjects.map((subject, index) => (
                 <div key={index} className="flex items-center mb-2">
                    <select
                                                   name="subjectName"
                                                   value={subject.subjectName}
                                                   onChange={(e) => handleSubjectChange(index, e)}
                                                className="w-36 mr-2 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="" disabled>Select Subject</option>
                                                {subjects.map(sub => (
                                                    <option key={sub.id} value={sub.name}>
                                                        {sub.name}
                                                    </option>
                                                ))}
                                            </select>
              
                 <input
                   type="text"
                   name="totalFees"
                   value={subject.totalFees}
                   onChange={(e) => handleSubjectChange(index, e)}
                   className="border border-gray-300 rounded-lg p-2 w-full mr-2"
                   placeholder="Total Fees"
                 />
                 <button
                   type="button"
                   onClick={() => handleRemoveSubject(index)}
                   className="text-red-500"
                 >
                   <FaTrash size={20} />
                 </button>
               </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="text-blue-500 hover:text-blue-700 focus:outline-none flex items-center"
                >
                  <FaPlus size={16} className="mr-2" />
                  Add Subject
                </button>
              </div>
              <div className="flex justify-end gap-4">
              <button
                  type="button"
                  onClick={handleSubmitEdit}
                  className="bg-blue-500 text-white rounded-lg p-2 mr-2"
                >
                  {isSaving ? 'Saving...' : 'Save'} {/* Show "Saving..." when saving */}
                </button>
                <button
                  type="button"
                  onClick={handleCloseEditPopup}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 focus:outline-none"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
              <QRCodeModal isOpen={isQRCodeModalOpen} onClose={() => setIsQRCodeModalOpen(false)} student={student} qrCodeUrl={qrCodeUrl} />
              <Adminregistrattionfooter
  onEdit={handleEditClick}
  handleQRCode={handleQRCode}
  handleNewPayment={handleNewPayment}
  adminAuthentication={adminAuthentication}
  userAuthentication={userAuthentication}
  onDelete={handleDelete}
/>

      <ToastContainer />
    </div>
    </div>
  );
};

export default StudentDetails;
