import { useEffect, useState } from 'react';
import type { Subject } from '@bowen-p2p/shared';
import { apiGet } from '../lib/api';

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Subject[]>('/subjects')
      .then(setSubjects)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-bowen-maroon">Subjects</h1>

      {loading && <p className="mt-4 text-sm text-gray-500">Loading subjects...</p>}
      {error && <p className="mt-4 text-sm text-red-600">Could not load subjects: {error}</p>}

      <ul className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {subjects.map((subject) => (
          <li key={subject.id} className="px-4 py-3">
            <p className="font-medium text-bowen-maroon">{subject.code}</p>
            <p className="text-sm text-gray-600">{subject.title}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
