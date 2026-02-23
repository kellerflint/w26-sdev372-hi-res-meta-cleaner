'use client';

import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

export default function LoginPrompt() {
  const router = useRouter();

  return (
    <div className={`page-content ${styles.loginPrompt}`}>
      <h2>Welcome to Hi-Res Meta Cleaner</h2>
      <p>Please log in to upload and manage your audio files.</p>
      <button
        type="button"
        className={`submit-button ${styles.loginButton}`}
        onClick={() => router.push('/login')}
      >
        Go to Login
      </button>
    </div>
  );
}
