import type { StudySession } from '@bowen-p2p/shared';

export default function SessionCard({ session }: { session: StudySession }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-bowen-maroon">{session.title}</h3>
      {session.description && <p className="mt-1 text-sm text-gray-600">{session.description}</p>}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div>
          <dt className="font-medium">Scheduled</dt>
          <dd>{new Date(session.scheduledFor).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="font-medium">Duration</dt>
          <dd>{session.durationMinutes} minutes</dd>
        </div>
        <div>
          <dt className="font-medium">Participants</dt>
          <dd>
            {session.participantIds.length} / {session.maxParticipants}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Status</dt>
          <dd className="capitalize">{session.status}</dd>
        </div>
      </dl>
    </article>
  );
}
