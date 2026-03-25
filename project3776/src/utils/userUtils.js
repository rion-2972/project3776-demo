import { getDefaultSubjects } from './constants';

export const detectRoleFromEmail = (email) => {
  if (!email) return null;
  
  const teacherDomains = [
    '@teacher.school.jp',
    '@staff.school.jp',
    '@faculty.school.jp'
  ];
  
  const studentDomains = [
    '@student.school.jp',
    '@st.school.jp'
  ];
  
  if (teacherDomains.some(domain => email.endsWith(domain))) {
    return 'teacher';
  }
  
  if (studentDomains.some(domain => email.endsWith(domain))) {
    return 'student';
  }
  
  if (email.includes('teacher') || email.includes('staff')) {
    return 'teacher';
  }
  
  if (email.includes('student') || email.includes('st')) {
    return 'student';
  }
  
  return null;
};

export const detectTypeFromEmail = (email, displayName = '') => {
  if (!email && !displayName) return null;
  
  const text = `${email} ${displayName}`.toLowerCase();
  
  if (text.includes('bunken') || text.includes('文系') || text.includes('liberal')) {
    return 'bunken';
  }
  
  if (text.includes('riken') || text.includes('理系') || text.includes('science')) {
    return 'riken';
  }
  
  return null;
};

export const createInitialProfile = (user) => {
  const detectedRole = detectRoleFromEmail(user.email);
  const detectedType = detectTypeFromEmail(user.email, user.displayName);
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    role: detectedRole || 'student',
    type: detectedType || 'riken',
    subjects: getDefaultSubjects(detectedType || 'riken'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const isProfileComplete = (profile) => {
  if (!profile) return false;
  
  return !!(
    profile.role &&
    profile.type &&
    profile.subjects &&
    profile.subjects.length > 0
  );
};