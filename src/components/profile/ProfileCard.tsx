import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/date";
import { getTranslations } from "@/i18n/server";

interface ProfileCardProps {
  user: {
    name: string;
    surname?: string | null;
    type: string;
    location?: string | null;
    bio?: string | null;
    skills?: string[];
    mission?: string | null;
    profilePhoto?: string | null;
    languages?: string[];
    createdAt: string;
  };
}

export async function ProfileCard({ user }: ProfileCardProps) {
  const { t } = await getTranslations();

  return (
    <div>
      <div className="flex items-center gap-5 mb-8">
        <Avatar name={user.name} src={user.profilePhoto} size="lg" />
        <div>
          <h1 className="text-3xl font-light">
            {user.name}{user.type === "PRIVATE" && user.surname ? ` ${user.surname}` : ""}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted font-mono uppercase tracking-wider">
            <span>{user.type}</span>
            {user.location && <span>{user.location}</span>}
          </div>
        </div>
      </div>

      {user.bio && (
        <div className="mt-4">
          <p className="text-fg/80 leading-relaxed">{user.bio}</p>
        </div>
      )}

      {user.type === "PRIVATE" && user.skills && user.skills.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-2">{t("profile.skills")}</p>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill) => (
              <span key={skill} className="text-xs font-mono border border-fg/20 px-2.5 py-0.5">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {user.type === "COLLECTIVE" && user.mission && (
        <div className="mt-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-2">{t("profile.mission")}</p>
          <p className="text-sm text-fg/80">{user.mission}</p>
        </div>
      )}

      {user.languages && user.languages.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-2">{t("profile.languages")}</p>
          <div className="flex flex-wrap gap-2">
            {user.languages.map((lang) => (
              <span key={lang} className="text-xs font-mono border border-fg/20 px-2.5 py-0.5">{lang}</span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 text-[11px] text-muted font-mono">
        {t("profile.memberSince")} {formatDate(user.createdAt)}
      </p>
    </div>
  );
}
