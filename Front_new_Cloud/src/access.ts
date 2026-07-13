/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  const role = currentUser?.access;
  return {
    canAdmin: role === 'admin',
    canProfessor: role === 'profesor' || role === 'professor',
    canStudent: role === 'user',
    canProfessorOrStudent:
      role === 'profesor' || role === 'professor' || role === 'user',
  };
}
