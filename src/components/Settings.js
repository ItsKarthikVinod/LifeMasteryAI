import React, { useState } from 'react';

const Settings = () => {
    const [displayName, setDisplayName] = useState('');
    const [showPomodoro, setShowPomodoro] = useState(true);

    const handleDisplayNameChange = (e) => {
        setDisplayName(e.target.value);
    };

    const handleTogglePomodoro = () => {
        setShowPomodoro(!showPomodoro);
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Settings</h1>
                <div className="mb-6">
                    <label
                        htmlFor="displayName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Display Name:
                    </label>
                    <input
                        type="text"
                        id="displayName"
                        value={displayName}
                        onChange={handleDisplayNameChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your display name"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pomodoroToggle"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Show Pomodoro Timer on Dashboard:
                    </label>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="pomodoroToggle"
                            checked={showPomodoro}
                            onChange={handleTogglePomodoro}
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                            {showPomodoro ? 'Shown' : 'Minimized'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        );
    };
    
    export default Settings;
