import React from 'react';
import { Outlet } from 'react-router-dom';
import './Admin.css';

export default function AdminLayout() {
    return (
        <div className="admin-container">
            <Outlet />
        </div>
    );
}
