export default function handler(req, res) {
  return res.status(410).json({
    success: false,
    error: 'Deprecated: use supabase.auth.signInWithOAuth({ provider: "kakao" }) instead.'
  });
}
