import { Form, Link, useLocation, useRouteLoaderData } from 'react-router';
import type { loader as rootLoader } from '~/root';

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const rootData = useRouteLoaderData<typeof rootLoader>('root');

  return (
    <nav className='navbar gap-4'>
      <Link to="/">
        <p className='text-2xl font-bold text-gradient'>SmartCV</p>
      </Link>

      <div className='flex gap-3 items-center max-md:hidden'>
        <Link
          to="/upload"
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            currentPath === '/upload'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ATS Review
        </Link>
        <Link
          to="/interview"
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            currentPath === '/interview'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Interview Prep
        </Link>
        <Link
          to="/jobs"
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            currentPath === '/jobs'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Job Search
        </Link>
      </div>

      <div className='flex items-center gap-3'>
        {rootData?.userEmail && (
          <>
            <span className='hidden lg:inline text-sm text-gray-600'>{rootData.userEmail}</span>
            <Form method='post' action='/logout'>
              <button
                type='submit'
                className='px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all cursor-pointer'
              >
                Logout
              </button>
            </Form>
          </>
        )}

        <div className='md:hidden'>
          <select
            className='px-4 py-2 rounded-full border border-gray-200 bg-white font-medium'
            value={currentPath}
            onChange={(e) => {
              window.location.href = e.target.value;
            }}
          >
            <option value="/">Dashboard</option>
            <option value="/upload">ATS Review</option>
            <option value="/interview">Interview Prep</option>
            <option value="/jobs">Job Search</option>
          </select>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
