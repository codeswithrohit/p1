import React, { useState, useEffect, useRef } from 'react';
import { firebase } from '../../Firebase/config';
import { FaSearch, FaUserPlus,FaTrash } from 'react-icons/fa';
import { FaDownload, FaEye } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify'; // Import Toastify for notifications
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify CSS
const Header = () => {
  return (
    <div className="bg-blue-500 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-white">Student List</h1>
      
      </div>
    </div>
  );
};

const Student = ({ studentData,onDelete }) => {



  const getBackgroundColor = (subject) => {
    if (subject.columns && Array.isArray(subject.columns) && subject.columns.length > 0) {
      const paidAmount = subject.columns.reduce((acc, cur) => {
        const parsedAmount = parseFloat(cur.amount);
        return !isNaN(parsedAmount) ? acc + parsedAmount : acc;
      }, 0);

      const totalFees = parseFloat(subject.totalFees);
      const percentagePaid = (paidAmount / totalFees) * 100;

      if (percentagePaid < 25) {
        return 'bg-red-500';
      } else if (percentagePaid >= 25 && percentagePaid < 100) {
        return 'bg-yellow-500';
      } else {
        return 'bg-green-500';
      }
    } else {
      return 'bg-gray-300'; // Default color for cases where data is missing
    }
  };
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      onDelete(studentData.id);
    }
  };
  return (
    <div className="flex items-center mb-4">
      <img src={studentData.imageUrl} className='h-16 w-16 rounded-full object-contain mr-8' />
      
      <Link href={`/studentdetails?id=${studentData.id}`}>
        <div className="text-2xl font-bold">{`${studentData.firstName} ${studentData.middleName} ${studentData.lastName}`}</div>
        <div className="flex items-center">
          {studentData.subjects.map((subject, index) => (
            <div key={index} className="flex items-center mr-2">
              
              <div
                className={`h-4 w-4 rounded-full mr-2 ${getBackgroundColor(subject)}`}
              ></div>
              <div className="text-sm font-semibold">{subject.subjectName}</div>
            </div>
          ))}
        </div>
      </Link>
      <div className="ml-auto flex space-x-4">
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700"
        >
          <FaTrash size={20} />
        </button>
      </div>
    </div>
  );
};




function Studentlist() {
  const router = useRouter();
  const [studentdata, setStudentdata] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = firebase.firestore();
        const docRef = db.collection('registrations');

        const snapshot = await docRef.get();

        if (!snapshot.empty) {
          let data = [];
          snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          setStudentdata(data);
        } else {
          console.log('No documents in the collection!');
        }
      } catch (error) {
        console.error('Error getting documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  const handleDelete = async (id) => {
    console.log("id", id);
    try {
      const db = firebase.firestore();
      
      // Query documents with the matching ID
      const querySnapshot = await db.collection('registrations')
                                   .where("id", "==", id)
                                   .get();
      
      if (!querySnapshot.empty) {
        // Iterate through matching documents and delete them
        querySnapshot.forEach(async (doc) => {
          await doc.ref.delete(); // Use doc.ref to get the document reference
        });
  
        // Update local state
        setStudentdata(studentdata.filter(student => student.id !== id));
        toast.success('Student deleted successfully');
      } else {
        toast.error('No matching student found');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete student');
    }
  };
  


 
  const [searchTerm, setSearchTerm] = useState('');

 
  const filteredStudents = studentdata.filter((student) => {
    const fullName = `${student.firstName} ${student.middleName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });
  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      {loading ? ( // Show loading indicator while fetching data
         <div aria-label="Loading..." role="status" class="flex min-h-screen justify-center items-center space-x-2">
         <svg class="h-20 w-20 animate-spin stroke-gray-500" viewBox="0 0 256 256">
             <line x1="128" y1="32" x2="128" y2="64" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"></line>
             <line x1="195.9" y1="60.1" x2="173.3" y2="82.7" stroke-linecap="round" stroke-linejoin="round"
                 stroke-width="24"></line>
             <line x1="224" y1="128" x2="192" y2="128" stroke-linecap="round" stroke-linejoin="round" stroke-width="24">
             </line>
             <line x1="195.9" y1="195.9" x2="173.3" y2="173.3" stroke-linecap="round" stroke-linejoin="round"
                 stroke-width="24"></line>
             <line x1="128" y1="224" x2="128" y2="192" stroke-linecap="round" stroke-linejoin="round" stroke-width="24">
             </line>
             <line x1="60.1" y1="195.9" x2="82.7" y2="173.3" stroke-linecap="round" stroke-linejoin="round"
                 stroke-width="24"></line>
             <line x1="32" y1="128" x2="64" y2="128" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"></line>
             <line x1="60.1" y1="60.1" x2="82.7" y2="82.7" stroke-linecap="round" stroke-linejoin="round" stroke-width="24">
             </line>
         </svg>
         <span class="text-4xl font-medium text-gray-500">Loading...</span>
     </div>
      ) : (
        <div>
       <div className="container mx-auto mb-40 p-4">
          {/* Search input for filtering students */}
          <div className="flex items-center bg-gray-200 p-2 rounded-md mb-4">
            <FaSearch className="mr-2" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent focus:outline-none w-full"
            />
          </div>
          {/* Display filtered students */}
          {filteredStudents.map((student, index) => (
            <Student key={student.id} studentData={student} onDelete={handleDelete} />
          ))}
        </div>

      <div className="fixed bottom-20 right-4">
        <Link href="/Admin/Newregistration">
          <FaUserPlus size={48} className="text-blue-500 cursor-pointer" />
        </Link>
      </div>
      </div>
      )}
      <ToastContainer/>
    </div>
  );
}

export default Studentlist;

