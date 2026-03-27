// src/components/Navbar.tsx
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

export const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authApi.logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/login');
        }
    };

    return (
        <div className="navbar bg-base-100 shadow-lg">
            <div className="flex-1">
                <Link to="/songs" className="btn btn-ghost text-xl">
                    MyGuitarLib
                </Link>
            </div>
            <div className="flex-none">
                <ul className="menu menu-horizontal px-1">
                    <li>
                        <Link to="/songs">Songs</Link>
                    </li>
                    <li>
                        <button onClick={handleLogout}>Logout</button>
                    </li>
                </ul>
            </div>
        </div>
    );
};
