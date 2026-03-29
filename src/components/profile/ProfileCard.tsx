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
    <div className="bg-white/80 rounded-2xl border-2 border-gray-100 shadow-sm p-8">
      <div className="flex items-start gap-6">
        <Avatar name={user.name} src={user.profilePhoto} size="lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{user.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge color={user.type === "COLLECTIVE" ? "violet" : "sky"}>
              {user.type}
            </Badge>
            {user.location && <span className="text-sm text-gray-500 font-handwritten text-base">{user.location}</span>}
          </div>
        </div>
      </div>

      {user.bio && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Bio</h2>
          <p className="text-gray-600 leading-relaxed">{user.bio}</p>
        </div>
      )}

      {user.type === "PRIVATE" && user.skills && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Skills</h2>
          <p className="text-gray-600">{user.skills}</p>
        </div>
      )}

      {user.type === "COLLECTIVE" && user.mission && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Mission</h2>
          <p className="text-gray-600">{user.mission}</p>
        </div>
      )}

      <p className="mt-6 text-xs text-gray-400 font-handwritten text-sm">
        Member since {new Date(user.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}
