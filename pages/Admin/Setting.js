import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserManage from '../../components/UserManage';

const Setting = () => {
  const [activeTab, setActiveTab] = useState('wallpaper');
  const [activeSubTab, setActiveSubTab] = useState('subject');
  const [showPopup, setShowPopup] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentSubject, setCurrentSubject] = useState({ id: '', name: '' });
  const [currentCollege, setCurrentCollege] = useState({ id: '', name: '' });
  const [currentBranch, setCurrentBranch] = useState({ id: '', name: '' });
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveData = async (collection, data, setData) => {
    if (data.some(item => !item.name)) return;

    setIsSaving(true);
    try {
      const db = firebase.firestore();
      // Clear existing data
      const existingData = await db.collection(collection).get();
      const deletePromises = existingData.docs.map(doc => db.collection(collection).doc(doc.id).delete());
      await Promise.all(deletePromises);

      // Save all data to Firestore
      const promises = data.map(item => {
        if (item.id) {
          return db.collection(collection).doc(item.id).set({ name: item.name });
        } else {
          return db.collection(collection).add({ name: item.name });
        }
      });
      await Promise.all(promises);

      // Show success notification
      toast.success('Data saved successfully!');

      // Hide popup
      setShowPopup(false);
      // Refresh the lists
      const snapshot = await db.collection(collection).get();
      const newData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setData(newData);
    } catch (error) {
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAnother = (setData, data) => {
    setData([...data, { name: '' }]);
  };

  const handleRemoveItem = async (index, collection, data, setData) => {
    const itemToRemove = data[index];
    if (itemToRemove.id) {
      try {
        await firebase.firestore().collection(collection).doc(itemToRemove.id).delete();
        const newData = data.filter((_, i) => i !== index);
        setData(newData);
        toast.success('Item removed successfully!');
      } catch (error) {
        toast.error('Failed to remove item.');
      }
    } else {
      const newData = data.filter((_, i) => i !== index);
      setData(newData);
    }
  };

  const handleEditItem = (item, setCurrentItem) => {
    setCurrentItem(item);
    setShowPopup(true);
  };

  const handleUpdateItem = async (collection, item, setCurrentItem, setData) => {
    try {
      const db = firebase.firestore();
      if (item.id) {
        await db.collection(collection).doc(item.id).update({ name: item.name });
        toast.success('Item updated successfully!');
      } else {
        await db.collection(collection).add({ name: item.name });
        toast.success('Item added successfully!');
      }
      setCurrentItem({ id: '', name: '' });
      setShowPopup(false);
      // Refresh the list
      const snapshot = await db.collection(collection).get();
      const newData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setData(newData);
    } catch (error) {
      toast.error('Failed to update item.');
    }
  };

  const handleSubjectChange = (index, value) => {
    const updatedSubjects = subjects.map((subject, i) => 
      i === index ? { ...subject, name: value } : subject
    );
    setSubjects(updatedSubjects);
  };

  const handleCollegeChange = (index, value) => {
    const updatedColleges = colleges.map((college, i) => 
      i === index ? { ...college, name: value } : college
    );
    setColleges(updatedColleges);
  };

  const handleBranchChange = (index, value) => {
    const updatedBranches = branches.map((branch, i) => 
      i === index ? { ...branch, name: value } : branch
    );
    setBranches(updatedBranches);
  };

  return (
    <div className='bg-white min-h-screen'>
      <ToastContainer />

      <div className="flex flex-col">
        {/* Tabs Container */}
        <div className="w-96 bg-white p-4 space-y-2">
          <button
            onClick={() => setActiveTab('wallpaper')}
            className={`w-full text-xs font-bold font-mono text-left px-4 py-2 rounded-md ${activeTab === 'wallpaper' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          >
            6.1 Set Wallpaper from Gallery
          </button>
          <button
            onClick={() => setActiveTab('username')}
            className={`w-full text-xs font-bold font-mono text-left px-4 py-2 rounded-md ${activeTab === 'username' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          >
            6.2 (Set / Change) Username and Password of All Users
          </button>
          <button
            onClick={() => setActiveTab('subject')}
            className={`w-full text-xs font-bold font-mono text-left px-4 py-2 rounded-md ${activeTab === 'subject' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          >
            6.3 Set Subject List, College List, Branch List
          </button>
          <button
            onClick={() => setActiveTab('factory')}
            className={`w-full text-xs font-bold font-mono text-left px-4 py-2 rounded-md ${activeTab === 'factory' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          >
            6.4 Factory Reset with Password (Backup Compulsory)
          </button>
        </div>

        {/* Content Container */}
        <div className="w-3/4 p-4">
          {activeTab === 'wallpaper' && <div>Content for Set Wallpaper from Gallery</div>}
          {activeTab === 'username' && <div> 
            <UserManage/>
            </div>}
          {activeTab === 'subject' && (
            <div>
              <div className="flex justify-between items-center space-x-12 mb-4">
                <button
                  onClick={() => setActiveSubTab('addSubject')}
                  className={`px-4 py-2 text-xs font-bold font-mono rounded-md ${activeSubTab === 'addSubject' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                >
                  Add Subject
                </button>
                <button
                  onClick={() => setActiveSubTab('addCollege')}
                  className={`px-4 py-2 text-xs font-bold font-mono rounded-md ${activeSubTab === 'addCollege' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                >
                  Add College
                </button>
                <button
                  onClick={() => setActiveSubTab('addBranch')}
                  className={`px-4 py-2 text-xs font-bold font-mono rounded-md ${activeSubTab === 'addBranch' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                >
                  Add Branch
                </button>
              </div>
              {activeSubTab === 'addSubject' && (
                <div className="relative h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {subjects.map((subject, index) => (
                      <div key={subject.id || index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={subject.name}
                          onChange={(e) => handleSubjectChange(index, e.target.value)}
                          className="border border-gray-300 p-2 rounded-md w-full"
                        />
                        <button
                          onClick={() => handleRemoveItem(index, 'subjects', subjects, setSubjects)}
                          className="bg-red-500 text-xs font-bold font-mono text-white px-4 py-2 rounded-md"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => handleEditItem(subject, setCurrentSubject)}
                          className="bg-yellow-500 text-xs font-bold font-mono text-white px-4 py-2 rounded-md"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddAnother(setSubjects, subjects)}
                      className="bg-blue-500 text-xs font-bold font-mono text-white px-4 py-2 rounded-md"
                    >
                      Add Another
                    </button>
                    <button
                      onClick={() => handleSaveData('subjects', subjects, setSubjects)}
                      className="bg-green-500 ml-2 text-xs font-bold font-mono text-white px-4 py-2 rounded-md mt-2"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Data'}
                    </button>
                  </div>
                </div>
              )}
              {activeSubTab === 'addCollege' && (
                <div className="relative h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {colleges.map((college, index) => (
                      <div key={college.id || index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={college.name}
                          onChange={(e) => handleCollegeChange(index, e.target.value)}
                          className="border border-gray-300 p-2 rounded-md w-full"
                        />
                        <button
                          onClick={() => handleRemoveItem(index, 'colleges', colleges, setColleges)}
                          className="bg-red-500 text-xs font-bold font-mono text-white px-4 py-2 rounded-md"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => handleEditItem(college, setCurrentCollege)}
                          className="bg-yellow-500 text-xs font-bold font-mono text-white px-4 py-2 rounded-md"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddAnother(setColleges, colleges)}
                      className="bg-blue-500 text-xs font-bold font-mono text-white px-4 py-2 rounded-md"
                    >
                      Add Another
                    </button>
                    <button
                      onClick={() => handleSaveData('colleges', colleges, setColleges)}
                      className="bg-green-500 ml-2 text-xs font-bold font-mono text-white px-4 py-2 rounded-md mt-2"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Data'}
                    </button>
                  </div>
                </div>
              )}
              {activeSubTab === 'addBranch' && (
                <div className="relative h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {branches.map((branch, index) => (
                      <div key={branch.id || index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={branch.name}
                          onChange={(e) => handleBranchChange(index, e.target.value)}
                          className="border border-gray-300 p-2 rounded-md w-full"
                        />
                        <button
                          onClick={() => handleRemoveItem(index, 'branches', branches, setBranches)}
                          className="bg-red-500 text-xs font-bold font-mono text-white px-4 py-2 rounded-md"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => handleEditItem(branch, setCurrentBranch)}
                          className="bg-yellow-500 text-xs font-bold font-mono text-white px-4 py-2 rounded-md"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddAnother(setBranches, branches)}
                      className="bg-blue-500 text-xs font-bold font-mono text-white px-4 py-2 rounded-md"
                    >
                      Add Another
                    </button>
                    <button
                      onClick={() => handleSaveData('branches', branches, setBranches)}
                      className="bg-green-500 ml-4 text-xs font-bold font-mono text-white px-4 py-2 rounded-md mt-2"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Data'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'factory' && <div>Content for Factory Reset with Password</div>}
        </div>
      </div>

      {/* Popup for editing */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <h2 className="text-lg font-bold mb-4">{currentSubject.id ? 'Edit Subject' : 'Add Subject'}</h2>
            <input
              type="text"
              value={currentSubject.name || currentCollege.name || currentBranch.name}
              onChange={(e) => {
                if (currentSubject.id) {
                  setCurrentSubject({ ...currentSubject, name: e.target.value });
                } else if (currentCollege.id) {
                  setCurrentCollege({ ...currentCollege, name: e.target.value });
                } else if (currentBranch.id) {
                  setCurrentBranch({ ...currentBranch, name: e.target.value });
                }
              }}
              className="border border-gray-300 p-2 rounded-md w-full mb-4"
            />
            <button
              onClick={() => {
                if (currentSubject.id) {
                  handleUpdateItem('subjects', currentSubject, setCurrentSubject, setSubjects);
                } else if (currentCollege.id) {
                  handleUpdateItem('colleges', currentCollege, setCurrentCollege, setColleges);
                } else if (currentBranch.id) {
                  handleUpdateItem('branches', currentBranch, setCurrentBranch, setBranches);
                }
              }}
              className="bg-green-500 text-white px-4 py-2 rounded-md"
            >
              Save
            </button>
            <button
              onClick={() => setShowPopup(false)}
              className="bg-red-500 text-white px-4 py-2 rounded-md ml-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Setting;
