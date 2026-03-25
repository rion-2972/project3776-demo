/**
 * Firebase 匿名ユーザーの初期プロファイルを作成する。
 * localStorage に保存された demo_role / demo_name を優先して使用する。
 * type・subjects は意図的に未設定（空）にすることで、
 * isProfileComplete が false を返し、ProfileSetup 画面へ誘導する。
 */
export const createInitialProfile = (user) => {
  const role = localStorage.getItem('demo_role') || 'student';
  const displayName = localStorage.getItem('demo_name') || '生徒';

  return {
    uid: user.uid,
    email: null,
    displayName,
    role,
    type: null,    // ProfileSetup で選択させる
    subjects: [],  // ProfileSetup で選択させる
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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