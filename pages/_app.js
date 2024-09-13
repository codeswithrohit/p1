import "@/styles/globals.css";
import React, { useState, useEffect, useCallback } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { firebase } from '../Firebase/config';
import { useRouter } from 'next/router';
import Button from "../components/Button";

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [userdata, setUserData] = useState([]);
  const [fingerprint, setFingerprint] = useState('');
  const [userAuthentication, setUserAuthentication] = useState(null);
  const [adminAuthentication, setAdminAuthentication] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user.email);
        await checkAuthentication(user.email, fingerprint);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fingerprint]);

  const getFingerprint = useCallback(async () => {
    let storedFingerprint = localStorage.getItem('fingerprint');

    if (storedFingerprint) {
      setFingerprint(storedFingerprint);
    } else {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      storedFingerprint = result.visitorId;
      localStorage.setItem('fingerprint', storedFingerprint);
      setFingerprint(storedFingerprint);
    }
  }, []);

  useEffect(() => {
    getFingerprint();
  }, [getFingerprint]);

  const checkAuthentication = useCallback(async (email, fingerprint) => {
    if (!email || !fingerprint) return;

    const cachedData = localStorage.getItem('authData');
    if (cachedData) {
      const { userAuth, adminAuth } = JSON.parse(cachedData);
      setUserAuthentication(userAuth);
      setAdminAuthentication(adminAuth);
      if (userAuth || adminAuth) {
        await fetchUserData(email);
      }
      setLoading(false);
      return;
    }

    const db = firebase.firestore();
    let userAuth = false;
    let adminAuth = false;

    const usersQuerySnapshot = await db.collection('users')
      .where('email', '==', email)
      .where('fingerprint', '==', fingerprint)
      .get();

    if (!usersQuerySnapshot.empty) {
      const userData = usersQuerySnapshot.docs.map(doc => doc.data());
      setUserData(userData);
      if (userData[0].active) {
        userAuth = true;
        setUserAuthentication(true);
      }
    }

    const adminQuerySnapshot = await db.collection('admin')
      .where('email', '==', email)
      .where('fingerprint', '==', fingerprint)
      .get();

    if (!adminQuerySnapshot.empty) {
      const adminData = adminQuerySnapshot.docs.map(doc => doc.data());
      setUserData(adminData);
      if (adminData[0].active) {
        adminAuth = true;
        setAdminAuthentication(true);
      }
    }

    if (!userAuth && !adminAuth) {
      setUserAuthentication(false);
      setAdminAuthentication(false);
    }

    localStorage.setItem('authData', JSON.stringify({ userAuth, adminAuth }));
    setLoading(false);
  }, []);

  const fetchUserData = useCallback(async (email) => {
    const db = firebase.firestore();

    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    const adminSnapshot = await db.collection('admin')
      .where('email', '==', email)
      .get();

    if (!usersSnapshot.empty) {
      const userData = usersSnapshot.docs.map(doc => doc.data());
      setUserData(userData);
      if (!userData[0].active) {
        setUserAuthentication(false);
      }
    } else if (!adminSnapshot.empty) {
      const adminData = adminSnapshot.docs.map(doc => doc.data());
      setUserData(adminData);
      if (!adminData[0].active) {
        setAdminAuthentication(false);
      }
    }
    console.log("userdata", userdata);
  }, []);

  useEffect(() => {
    const db = firebase.firestore();

    if (user && fingerprint) {
      const unsubscribeUsers = db.collection('users')
        .where('email', '==', user)
        .where('fingerprint', '==', fingerprint)
        .onSnapshot(snapshot => {
          if (!snapshot.empty) {
            const userData = snapshot.docs.map(doc => doc.data());
            setUserData(userData);
            if (userData[0].active) {
              setUserAuthentication(true);
            } else {
              setUserAuthentication(false);
            }
            updateLocalStorage();
          }
        });

      const unsubscribeAdmin = db.collection('admin')
        .where('email', '==', user)
        .where('fingerprint', '==', fingerprint)
        .onSnapshot(snapshot => {
          if (!snapshot.empty) {
            const adminData = snapshot.docs.map(doc => doc.data());
            setUserData(adminData);
            if (adminData[0].active) {
              setAdminAuthentication(true);
            } else {
              setAdminAuthentication(false);
            }
            updateLocalStorage();
          }
        });

      return () => {
        unsubscribeUsers();
        unsubscribeAdmin();
      };
    }
  }, [user, fingerprint, fetchUserData]);

  const updateLocalStorage = useCallback(() => {
    const authData = {
      userAuth: userAuthentication,
      adminAuth: adminAuthentication,
    };
    localStorage.setItem('authData', JSON.stringify(authData));
  }, [userAuthentication, adminAuthentication]);

  useEffect(() => {
    if (!loading) {
      const currentRoute = router.pathname;

      const isAdminRoute = currentRoute.startsWith('/Admin');
      const isUserRoute = currentRoute.startsWith('/User');

      const excludedRoutes = ['/login', '/fingerprint','/QrScanner','/studentdetails','/Newpayment','/serverdown' ];

      if (!excludedRoutes.includes(currentRoute)) {
        if (isAdminRoute && !adminAuthentication) {
          router.push('/login');
        } else if (isUserRoute && !userAuthentication) {
          router.push('/login');
        } else if (!isAdminRoute && !isUserRoute) {
          if (userAuthentication) {
            router.push('/User');
          } else if (adminAuthentication) {
            router.push('/Admin');
          } else {
            router.push('/serverdown');
          }
        }
      }
    }
  }, [userAuthentication, adminAuthentication, router, user, loading]);

  if (loading) {
    return <div className="min-h-screen bg-white" >Loading...</div>;
  }

  return (
    <div
    className="bg-white "  // Add relative and min-h-screen to ensure the full screen and correct positioning
  
  >
    <div className="relative z-10 p-4">  {/* Wrap content in a relative container with proper z-index */}
      <Component
        {...pageProps}
        user={user}
        adminAuthentication={adminAuthentication}
        userAuthentication={userAuthentication}
        userdata={userdata}
      />
      <Button />
    </div>
  </div>
  
  
  );
}
