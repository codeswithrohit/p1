import Adminhomefooter from '@/components/Adminhomefooter';
import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';
import 'firebase/auth';
const db = firebase.firestore();

const UserButton = ({ user }) => {
  const [isUserActive, setIsUserActive] = useState(user.active);

  const toggleStatus = async () => {
    try {
      const userRef = db.collection('users').doc(user.id);
      await userRef.update({ active: !isUserActive });
      setIsUserActive(!isUserActive);
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  return (
    <div className="bg-white flex items-center justify-between p-3 rounded-lg mb-2 shadow-md">
      <span className="text-lg font-semibold">{user.name}</span>
      <button
        onClick={toggleStatus}
        className={`relative w-12 h-6 rounded-full ${
          isUserActive ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        <div
          className={`absolute left-0 top-0 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
            isUserActive ? 'translate-x-full' : 'translate-x-0'
          }`}
        ></div>
      </button>
    </div>
  );
};

const Index = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();
        const userData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="bg-white w-full min-h-screen flex flex-col md:flex-row md:flex-wrap p-4">
      {users.length > 0 ? (
        users.map((user) => (
          <div key={user.id} className="md:w-1/3 p-2">
            <UserButton user={user} />
          </div>
        ))
      ) : (
        <p>No users found.</p>
      )}
      <Adminhomefooter />
    </div>
  );
};

export default Index;
