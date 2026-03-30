interface ProfileCardProps {
  user: {
    name: string;
    type: string;
    location?: string | null;
    bio?: string | null;
    skills?: string | null;
    mission?: string | null;
    profilePhoto?: string | null;
    createdAt: string;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div>
      <h1 className="font-display text-5xl sm:text-6xl font-300 tracking-tight">{user.name}</h1>
      <div className="flex gap-6 mt-4 font-label text-muted">
        <span>{user.type}</span>
        {user.location && <span>{user.location}</span>}
        <span>Since {new Date(user.createdAt).toLocaleDateString()}</span>
      </div>

      {user.bio && (
        <p className="mt-10 text-[15px] text-fg/75 leading-[1.8] max-w-2xl">{user.bio}</p>
      )}

      {user.type === "PRIVATE" && user.skills && (
        <div className="mt-8">
          <p className="font-label text-muted mb-2">Skills</p>
          <p className="text-sm text-fg/75">{user.skills}</p>
        </div>
      )}

      {user.type === "COLLECTIVE" && user.mission && (
        <div className="mt-8">
          <p className="font-label text-muted mb-2">Mission</p>
          <p className="text-sm text-fg/75">{user.mission}</p>
        </div>
      )}
    </div>
  );
}
