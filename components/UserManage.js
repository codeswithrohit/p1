import React, { useEffect, useState } from 'react';
import { firebase } from '../Firebase/config'; // Import Firebase app
import 'firebase/firestore'; // Import Firestore
import { ToastContainer, toast } from 'react-toastify'; // Import React Toastify
import 'react-toastify/dist/ReactToastify.css'; // Import React Toastify CSS

const UserManage = () => {
  const [userList, setUserList] = useState([]);
  const [editUserId, setEditUserId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFingerprint, setEditFingerprint] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Initialize Firestore
    const db = firebase.firestore();

    // Function to fetch user data
    const fetchUserData = async () => {
      try {
        const userCollection = db.collection('users');
        const userSnapshot = await userCollection.get();
        const users = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Log user data to the console
        console.log(users);
        
        // Set user data to state
        setUserList(users);
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };

    // Call the fetch function
    fetchUserData();
  }, []);

  // Handle edit button click
  const handleEditClick = (id, name, fingerprint) => {
    setEditUserId(id);
    setEditName(name);
    setEditFingerprint(fingerprint);
    setIsModalOpen(true);
  };

  // Handle save button click
  const handleSaveClick = async () => {
    try {
      const db = firebase.firestore();
      await db.collection('users').doc(editUserId).update({
        name: editName,
        fingerprint: editFingerprint
      });
      
      // Update the local state to reflect changes
      setUserList(userList.map(user => 
        user.id === editUserId ? { ...user, name: editName, fingerprint: editFingerprint } : user
      ));
      
      // Show success notification
      toast.success("User data updated successfully!");
      
      // Clear the edit state and close modal
      setEditUserId(null);
      setEditName('');
      setEditFingerprint('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating user data: ", error);
      toast.error("Error updating user data. Please try again.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userList.length === 0 ? (
          <p className="text-center col-span-full">No users found</p>
        ) : (
          userList.map(user => (
            <div key={user.id} className="bg-white p-2 border border-gray-200 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">{user.name}</h2>
              <p className="text-gray-600 mb-2">Email: {user.email}</p>
              <p className="text-gray-600 mb-2 text-xs">Fingerprint: {user.fingerprint}</p>
              <p className="text-gray-600 mb-2">Active: {user.active ? 'Yes' : 'No'}</p>
              <button
                onClick={() => handleEditClick(user.id, user.name, user.fingerprint)}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Edit
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal for editing name and fingerprint */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full">
            <h2 className="text-2xl font-semibold mb-4">Edit User</h2>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
              placeholder="Enter new name"
            />
            <input
              type="text"
              value={editFingerprint}
              onChange={(e) => setEditFingerprint(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
              placeholder="Enter new fingerprint"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveClick}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Save
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default UserManage;
