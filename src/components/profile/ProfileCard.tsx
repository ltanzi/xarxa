import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

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
    <div className="bg-white rounded-lg border shadow-sm p-8">
      <div className="flex items-start gap-6">
        <Avatar name={user.name} src={user.profilePhoto} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge>{user.type}</Badge>
            {user.location && <span className="text-sm text-gray-500">{user.location}</span>}
          </div>
        </div>
      </div>

      {user.bio && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Bio</h2>
          <p className="text-gray-700">{user.bio}</p>
        </div>
      )}

      {user.type === "PRIVATE" && user.skills && (
        <div className="mt-4">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Skills</h2>
          <p className="text-gray-700">{user.skills}</p>
        </div>
      )}

      {user.type === "COLLECTIVE" && user.mission && (
        <div className="mt-4">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Mission</h2>
          <p className="text-gray-700">{user.mission}</p>
        </div>
      )}

      <p className="mt-6 text-xs text-gray-400">
        Member since {new Date(user.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}
