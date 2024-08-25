import { useRouter } from 'next/router';
import { useEffect } from 'react';

const withAuth = (WrappedComponent, allowedRoles) => {
  return (props) => {
    const router = useRouter();
    const { userAuthenticated, adminAuthenticated } = props;

    useEffect(() => {
      if (!userAuthenticated && !adminAuthenticated) {
        router.push('/login'); // Redirect to login page if not authenticated
      } else if (!allowedRoles.includes('admin') && adminAuthenticated) {
        router.push('/'); // Redirect admin if not authorized for the page
      } else if (!allowedRoles.includes('user') && userAuthenticated) {
        router.push('/User'); // Redirect user if not authorized for the page
      }
    }, [userAuthenticated, adminAuthenticated]);

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
