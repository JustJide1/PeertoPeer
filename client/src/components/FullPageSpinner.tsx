import Spinner from './Spinner';

export default function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Spinner className="h-8 w-8 text-blue-900" />
    </div>
  );
}
