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
      <h1 className="text-3xl font-light">{user.name}</h1>
      <div className="flex items-center gap-4 mt-2 text-xs text-muted font-mono uppercase tracking-wider">
        <span>{user.type}</span>
        {user.location && <span>{user.location}</span>}
      </div>

      {user.bio && (
        <div className="mt-8">
          <p className="text-fg/80 leading-relaxed">{user.bio}</p>
        </div>
      )}

      {user.type === "PRIVATE" && user.skills && (
        <div className="mt-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-2">Skills</p>
          <p className="text-sm text-fg/80">{user.skills}</p>
        </div>
      )}

      {user.type === "COLLECTIVE" && user.mission && (
        <div className="mt-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-2">Mission</p>
          <p className="text-sm text-fg/80">{user.mission}</p>
        </div>
      )}

      <p className="mt-8 text-[11px] text-muted font-mono">
        Since {new Date(user.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}
