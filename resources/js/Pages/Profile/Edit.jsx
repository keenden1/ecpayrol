import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Camera, Mail, Lock, Eye, EyeOff, Save } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status, photoUrl }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const {
        data: profileData,
        setData: setProfileData,
        post: postProfile,
        errors: profileErrors,
        processing: profileProcessing,
        recentlySuccessful: profileSaved,
    } = useForm({
        _method: 'PATCH',
        name: user?.name ?? '',
        email: user?.email ?? '',
        photo: null,
    });

    const passwordRef = useRef();
    const currentPasswordRef = useRef();
    const {
        data: passData,
        setData: setPassData,
        post: postPass,
        errors: passErrors,
        processing: passProcessing,
        reset: resetPass,
        recentlySuccessful: passSaved,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [previewUrl, setPreviewUrl] = useState(photoUrl || null);
    const [imgError, setImgError] = useState(false);
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const fileInputRef = useRef();

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setProfileData('photo', file);
        setImgError(false);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const submitProfile = (e) => {
        e.preventDefault();
        postProfile('/profile', { forceFormData: true });
    };

    const submitPassword = (e) => {
        e.preventDefault();
        postPass('/profile/password', {
            preserveScroll: true,
            onSuccess: () => resetPass(),
            onError: (errors) => {
                if (errors.password) {
                    resetPass('password', 'password_confirmation');
                    passwordRef.current?.focus();
                }
                if (errors.current_password) {
                    resetPass('current_password');
                    currentPasswordRef.current?.focus();
                }
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Profile" />

            <div className="py-8 px-4 max-w-4xl mx-auto space-y-6">

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />

                    <form onSubmit={submitProfile}>
                        <div className="px-8 pb-8">
                            {/* Avatar row */}
                            <div className="flex items-end gap-4 -mt-12 mb-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-indigo-100 flex items-center justify-center">
                                        {previewUrl && !imgError ? (
                                            <img
                                                src={previewUrl}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={() => setImgError(true)}
                                            />
                                        ) : (
                                            <span className="text-3xl font-bold text-indigo-600">
                                                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-indigo-700 transition"
                                    >
                                        <Camera size={14} />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoChange}
                                    />
                                </div>
                                <div className="pb-1">
                                    <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                </div>
                            </div>

                            <p className="text-sm font-semibold text-gray-700 mb-4">Profile Information</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData('name', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                    {profileErrors.name && <p className="mt-1 text-xs text-red-500">{profileErrors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData('email', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    {profileErrors.email && <p className="mt-1 text-xs text-red-500">{profileErrors.email}</p>}
                                </div>
                            </div>

                            {profileErrors.photo && <p className="mt-3 text-xs text-red-500">{profileErrors.photo}</p>}

                            <div className="mt-6 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={profileProcessing}
                                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
                                >
                                    <Save size={15} />
                                    Save Changes
                                </button>
                                {profileSaved && <span className="text-sm text-green-600">Saved!</span>}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Password Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Lock size={16} className="text-indigo-500" />
                        Change Password
                    </p>

                    <form onSubmit={submitPassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <div className="relative">
                                <input
                                    ref={currentPasswordRef}
                                    type={showCurrentPass ? 'text' : 'password'}
                                    value={passData.current_password}
                                    onChange={(e) => setPassData('current_password', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {passErrors.current_password && <p className="mt-1 text-xs text-red-500">{passErrors.current_password}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        ref={passwordRef}
                                        type={showNewPass ? 'text' : 'password'}
                                        value={passData.password}
                                        onChange={(e) => setPassData('password', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {passErrors.password && <p className="mt-1 text-xs text-red-500">{passErrors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPass ? 'text' : 'password'}
                                        value={passData.password_confirmation}
                                        onChange={(e) => setPassData('password_confirmation', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {passErrors.password_confirmation && <p className="mt-1 text-xs text-red-500">{passErrors.password_confirmation}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                            <button
                                type="submit"
                                disabled={passProcessing}
                                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
                            >
                                <Save size={15} />
                                Update Password
                            </button>
                            {passSaved && <span className="text-sm text-green-600">Password updated!</span>}
                        </div>
                    </form>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
