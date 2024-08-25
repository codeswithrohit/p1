import React, { useState, useEffect } from 'react';
import { FaAngleDown, FaAngleUp } from 'react-icons/fa';
import Modal from 'react-modal';
import { FaUserEdit, FaQrcode, FaFileAlt, FaCog, FaUser } from 'react-icons/fa';
import { MdOutlinePayments } from 'react-icons/md';
import Link from 'next/link';
import { firebase } from '../../Firebase/config';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import FileSaver from 'file-saver';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Newregistration = () => {
    const router = useRouter();
    const [subjects, setSubjects] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        collegeName: '',
        branch: '',
        whatsappNumber: '',
        callingNumber: '',
        subjects: [{ subjectName: '', totalFees: '' }],
    });
    const [image, setImage] = useState(null);
    const [imageURL, setImageURL] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // New state for edit mode

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

    const handleChange = (e, index) => {
        const { name, value } = e.target;

        if (name === 'subjectName' || name === 'totalFees') {
            const updatedSubjects = [...formData.subjects];
            updatedSubjects[index][name] = value;
            setFormData({ ...formData, subjects: updatedSubjects });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const addSubject = () => {
        setFormData({
            ...formData,
            subjects: [...formData.subjects, { subjectName: '', totalFees: '' }],
        });
    };

    const removeSubject = (index) => {
        if (formData.subjects.length > 1) {
            const updatedSubjects = formData.subjects.filter((_, i) => i !== index);
            setFormData({ ...formData, subjects: updatedSubjects });
        } else {
            toast.error("Cannot remove the last subject.");
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
            setImageURL(file);
        }
    };

    const validateForm = () => {
        const errors = [];

        if (!formData.firstName.trim()) errors.push('First Name');
        if (!formData.middleName.trim()) errors.push('Middle Name');
        if (!formData.lastName.trim()) errors.push('Last Name');
        if (!formData.collegeName.trim()) errors.push('College Name');
        if (!formData.branch.trim()) errors.push('Branch');
        if (!formData.whatsappNumber.trim()) errors.push('WhatsApp Number');
        if (!formData.callingNumber.trim()) errors.push('Calling Number');
        formData.subjects.forEach((subject, index) => {
            if (!subject.subjectName.trim()) errors.push(`Subject Name ${index + 1}`);
            if (!subject.totalFees.trim()) errors.push(`Total Fees ${index + 1}`);
        });
        if (!imageURL) errors.push('Image');

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEditing) {
            alert('Edit mode is active. Make necessary changes and then submit.');
            return;
        }
        const errors = validateForm();
        if (errors.length > 0) {
            errors.forEach(error => toast.error(`${error} is required`));
            return;
        }

        if (!window.confirm('Do you want to submit the form data?')) {
            return;
        }

        setIsSubmitting(true);

        // Generate QR code URL
        const id = new Date().getTime(); // Example ID, replace with your unique ID logic
        const qrCodeUrl = `http://myqridcard.in/studentdetails?id=${id}`;
        let qrCodeImage = '';

        try {
            // Generate QR Code
            qrCodeImage = await QRCode.toDataURL(qrCodeUrl);

            // Upload QR Code to Firebase Storage
            const storageRef = firebase.storage().ref();
            const qrCodeRef = storageRef.child(`qrcodes/${id}.png`);
            const response = await fetch(qrCodeImage);
            const blob = await response.blob();
            
            const uploadTask = qrCodeRef.put(blob);
            uploadTask.on('state_changed', 
                (snapshot) => {
                    // Progress monitoring
                    const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setUploadProgress(progress);
                }, 
                (error) => {
                    toast.error('Failed to upload QR code.');
                    setIsSubmitting(false);
                }, 
                async () => {
                    // QR code upload successful
                    const qrCodeDownloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                    // Upload image to Firebase Storage
                    let imageDownloadURL = '';
                    if (imageURL) {
                        const imageRef = storageRef.child(`images/${id}`);
                        const imageUploadTask = imageRef.put(imageURL);
                        await new Promise((resolve, reject) => {
                            imageUploadTask.on('state_changed', 
                                (snapshot) => {
                                    // Progress monitoring
                                    const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                                    setUploadProgress(progress);
                                }, 
                                (error) => {
                                    toast.error('Failed to upload image.');
                                    reject(error);
                                }, 
                                async () => {
                                    imageDownloadURL = await imageUploadTask.snapshot.ref.getDownloadURL();
                                    resolve();
                                }
                            );
                        });
                    }

                    // Save form data along with QR code and image URL to Firestore
                    const db = firebase.firestore();
                    await db.collection('registrations').add({
                        ...formData,
                        qrCodeUrl: qrCodeDownloadURL,
                        imageUrl: imageDownloadURL,
                        id:id,
                        createdAt: new Date()
                    });

                    toast.success('Registration successful!');
                    setIsSubmitting(false);
                       router.push(`/studentdetails?id=${id}`);
                }
            );
        } catch (error) {
            toast.error('Failed to generate or upload QR code.');
            setIsSubmitting(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        setIsEditing(false);
        alert('Changes saved.');
    };


    return (
        <div className='min-h-screen bg-white'>
            <div>
                <div className="container mx-auto p-4">
                    <div className="bg-gradient-to-b from-sky-400 to-white">
                        <h1 className="text-xl font-semibold mb-4 text-center">New Registration</h1>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-3 gap-4 w-full">
                            <div className="col-span-2">
                                <div className="mb-4 flex">
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        required
                                        onChange={handleChange}
                                        placeholder="First Name"
                                        className="w-20 mr-2 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    />
                                    <input
                                        type="text"
                                        name="middleName"
                                        value={formData.middleName}
                                        onChange={handleChange}
                                        placeholder="Middle Name"
                                        className="w-20 mr-2 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    />
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Last Name"
                                        className="w-20 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        College Name
                                    </label>
                                    <select
                                        name="collegeName"
                                        value={formData.collegeName}
                                        onChange={handleChange}
                                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="" disabled>Select College</option>
                                        {colleges.map(college => (
                                            <option key={college.id} value={college.name}>
                                                {college.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Branch
                                    </label>
                                    <select
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="" disabled>Select Branch</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.name}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <input
                                        type="text"
                                        name="whatsappNumber"
                                        required
                                        value={formData.whatsappNumber}
                                        onChange={handleChange}
                                        placeholder="WhatsApp Number"
                                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="mb-4">
                                    <input
                                        type="text"
                                        name="callingNumber"
                                        required
                                        value={formData.callingNumber}
                                        onChange={handleChange}
                                        placeholder="Calling Number"
                                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Subjects
                                    </label>
                                    {formData.subjects.map((subject, index) => (
                                        <div key={index} className="flex mb-2">
                                           <select
                                                name="subjectName"
                                                value={subject.subjectName}
                                                onChange={(e) => handleChange(e, index)}
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
                                                onChange={(e) => handleChange(e, index)}
                                                placeholder="Total Fees"
                                                className="w-36 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeSubject(index)}
                                                  className="ml-2 bg-red-500 text-white text-xs font-mono font-bold py-1 px-2 rounded-lg focus:outline-none hover:bg-red-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addSubject}
                                                                               className="bg-blue-500 text-white text-sm font-bold py-1 px-2 rounded-lg focus:outline-none hover:bg-blue-600"
                                    >
                                        Add Subject
                                    </button>
                                </div>
                            </div>

                            <div>
                                 <div className="col-span-1 mt-16">
                            <div className="rounded-md border border-black bg-gray-50 p-2 shadow-md w-24">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Upload Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="py-2 w-20 px-3 border border-gray-300 rounded-lg"
                                    />
                                    {image && (
                                        <div className="mt-2">
                                            <img src={image} alt="Selected" className="w-32 h-32 object-cover" />
                                        </div>
                                    )}
</div>

                            </div>
                              
                            </div>
                            <button
                                    type="submit"
                                    className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </button>
                                {/* <button
                                type="button"
                                onClick={isEditing ? handleSave : handleEdit}
                                className="ml-2 bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600"
                            >
                                {isEditing ? 'Save' : 'Edit'}
                            </button> */}
                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="mt-2">
                                        Upload Progress: {uploadProgress}%
                                    </div>
                                )}
                        </div>
                    </form>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Newregistration;
