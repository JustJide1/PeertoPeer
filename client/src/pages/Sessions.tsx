import { useEffect, useState } from 'react';
import type { StudySession } from '@bowen-p2p/shared';
import SessionCard from '../components/SessionCard';
import { apiGet } from '../lib/api';

export default function Sessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<StudySession[]>('/sessions')
      .then(setSessions)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-bowen-maroon">Study Sessions</h1>

      {loading && <p className="mt-4 text-sm text-gray-500">Loading sessions...</p>}
      {error && <p className="mt-4 text-sm text-red-600">Could not load sessions: {error}</p>}
      {!loading && !error && sessions.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">
          No study sessions yet. Be the first to create one!
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </section>
  );
}
