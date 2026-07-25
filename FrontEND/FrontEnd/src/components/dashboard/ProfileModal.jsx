import { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { FiMail, FiUser, FiLock, FiKey, FiCamera, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import '../styles/profile-modal.css';

const initials = (str = '') =>
  str.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

/* ── Upload avatar to backend (which forwards to Cloudinary) ── */
const uploadAvatarFile = async (file) => {
  const fd = new FormData();
  fd.append('file', file);

  const res = await api.post('/upload/avatar', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return res.data.url;
};

const ProfileModal = ({ onClose }) => {
  const { user, updateProfile, changePassword } = useAuth();

  const [formData, setFormData] = useState(() => ({
    fullName: user?.full_name  || user?.fullName  || '',
    username: user?.username   || '',
  }));
  const [avatarPreview, setAvatarPreview] = useState(
    () => user?.avatar_url || user?.avatarUrl || user?.avatar || ''
  );
  // null = unchanged, '' = removed, string url = newly uploaded
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [showPwSection, setShowPwSection] = useState(false);
  const [pwData,    setPwData]    = useState({ current: '', next: '', confirm: '' });
  const [pwError,   setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const [saving,     setSaving]     = useState(false);
  const [savingPw,   setSavingPw]   = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const fileInputRef = useRef(null);

  /* ── profile handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMsg('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg('Image must be smaller than 5MB.');
      return;
    }

    // instant local preview while uploading
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setUploadingAvatar(true);
    setProfileMsg('');

    try {
      const url = await uploadAvatarFile(file);
      setAvatarPreview(url);
      setAvatarFile(url);
    } catch (err) {
      console.error(err);
      setProfileMsg(err?.response?.data?.error || 'Failed to upload image. Please try again.');
      setAvatarPreview(user?.avatar_url || user?.avatarUrl || user?.avatar || '');
    } finally {
      setUploadingAvatar(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setAvatarFile('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    try {
      const avatarToSend = avatarFile !== null
        ? avatarFile
        : (user?.avatar_url || user?.avatarUrl || user?.avatar || '');
      await updateProfile(formData.fullName, formData.username, avatarToSend);
      setProfileMsg('Profile saved successfully.');
      setAvatarFile(null);
    } catch (err) {
      setProfileMsg('Failed to save profile. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ── password handlers ── */
  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwData(prev => ({ ...prev, [name]: value }));
    setPwError(''); setPwSuccess('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwData.next.length < 6) {
      setPwError('New password must be at least 6 characters.'); return;
    }
    if (pwData.next !== pwData.confirm) {
      setPwError('New passwords do not match.'); return;
    }
    setSavingPw(true);
    try {
      await changePassword(pwData.current, pwData.next);
      setPwSuccess('Password changed successfully.');
      setPwData({ current: '', next: '', confirm: '' });
      setTimeout(() => setShowPwSection(false), 1500);
    } catch (err) {
      setPwError(err?.response?.data?.error || 'Failed to change password.');
      console.error(err);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-panel" onClick={e => e.stopPropagation()}>

        {/* header */}
        <div className="pm-header">
          <div className="pm-header-left">
            <FiUser size={20} color="var(--gold)" />
            <div>
              <h2 className="pm-title">Profile</h2>
              <p className="pm-subtitle">{user?.email || ''}</p>
            </div>
          </div>
          <button className="pm-close" onClick={onClose} title="Close">
            <FiX size={16} />
          </button>
        </div>

        {/* body */}
        <div className="pm-body">

          {/* avatar */}
          <div className="pm-avatar-section">
            <div className="pm-avatar-ring">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="pm-avatar-img"
                     onError={() => setAvatarPreview('')}/>
              ) : (
                <span className="pm-avatar-initials">
                  {initials(formData.username || formData.fullName || user?.email)}
                </span>
              )}
              <button className="pm-avatar-change"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      title="Upload photo">
                {uploadingAvatar ? <FiLoader size={14} className="pm-spin" /> : <FiCamera size={14} />}
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*"
                   style={{ display: 'none' }} onChange={handleFileChange}/>

            <div className="pm-avatar-actions">
              <button type="button" className="pm-avatar-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}>
                <FiCamera size={13} /> {uploadingAvatar ? 'Uploading…' : 'Upload photo'}
              </button>
              {avatarPreview && (
                <button type="button" className="pm-avatar-remove-btn"
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}>
                  <FiX size={13} /> Remove
                </button>
              )}
            </div>
          </div>

          {/* profile form */}
          <form className="pm-form" onSubmit={handleProfileSubmit}>
            <div className="pm-section-label">Account info</div>

            {/* email — read only */}
            <div className="pm-field">
              <label className="pm-label">Email</label>
              <div className="pm-input-wrap">
                <span className="pm-input-icon"><FiMail size={13} /></span>
                <input className="pm-input readonly" type="email"
                       value={user?.email || ''} readOnly tabIndex={-1}/>
                <span className="pm-readonly-badge">read-only</span>
              </div>
            </div>

            {/* username */}
            <div className="pm-field">
              <label className="pm-label" htmlFor="pm-username">Username</label>
              <div className="pm-input-wrap">
                <span className="pm-input-icon"><FiUser size={13} /></span>
                <input id="pm-username" className="pm-input" type="text"
                       name="username" value={formData.username}
                       onChange={handleChange} placeholder="your_username"
                       autoComplete="username"/>
              </div>
            </div>

            {/* full name */}
            <div className="pm-field">
              <label className="pm-label" htmlFor="pm-fullname">Full name</label>
              <div className="pm-input-wrap">
                <span className="pm-input-icon"><FiUser size={13} /></span>
                <input id="pm-fullname" className="pm-input" type="text"
                       name="fullName" value={formData.fullName}
                       onChange={handleChange} placeholder="Jane Doe"
                       autoComplete="name"/>
              </div>
            </div>

            {profileMsg && (
              <p className={`pm-msg${profileMsg.includes('success') ? ' success' : ' error'}`}>
                {profileMsg}
              </p>
            )}

            <button type="submit" className="pm-save-btn" disabled={saving || uploadingAvatar}>
              <FiCheck size={14} />
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>

          {/* password section */}
          <div className="pm-pw-section">
            <div className="pm-section-label">Security</div>
            <button className="pm-pw-toggle" onClick={() => {
              setShowPwSection(v => !v);
              setPwError(''); setPwSuccess('');
              setPwData({ current: '', next: '', confirm: '' });
            }}>
              <span className="pm-pw-toggle-left">
                <FiLock size={14} /> Change password
              </span>
              <span className="pm-pw-caret">{showPwSection ? '▴' : '▾'}</span>
            </button>

            {showPwSection && (
              <form className="pm-pw-form" onSubmit={handlePasswordSubmit}>

                <div className="pm-field">
                  <label className="pm-label" htmlFor="pm-current">Current password</label>
                  <div className="pm-input-wrap">
                    <span className="pm-input-icon"><FiKey size={13} /></span>
                    <input id="pm-current" className="pm-input" type="password"
                           name="current" value={pwData.current}
                           onChange={handlePwChange}
                           placeholder="Enter current password"
                           autoComplete="current-password" required/>
                  </div>
                </div>

                <div className="pm-field">
                  <label className="pm-label" htmlFor="pm-next">New password</label>
                  <div className="pm-input-wrap">
                    <span className="pm-input-icon"><FiLock size={13} /></span>
                    <input id="pm-next" className="pm-input" type="password"
                           name="next" value={pwData.next}
                           onChange={handlePwChange}
                           placeholder="Min. 6 characters"
                           autoComplete="new-password" required/>
                  </div>
                </div>

                <div className="pm-field">
                  <label className="pm-label" htmlFor="pm-confirm">Confirm password</label>
                  <div className="pm-input-wrap">
                    <span className="pm-input-icon"><FiLock size={13} /></span>
                    <input id="pm-confirm" className="pm-input" type="password"
                           name="confirm" value={pwData.confirm}
                           onChange={handlePwChange}
                           placeholder="Repeat new password"
                           autoComplete="new-password" required/>
                  </div>
                </div>

                {pwError   && <p className="pm-msg error">{pwError}</p>}
                {pwSuccess && <p className="pm-msg success">{pwSuccess}</p>}

                <button type="submit" className="pm-save-btn" disabled={savingPw}>
                  <FiCheck size={14} />
                  {savingPw ? 'Updating…' : 'Update password'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;