import type { Profile } from "@flynetdev/react";
import { Tag, type TagTone } from "./tag";

function statusTag(status: Profile["accountStatus"]): {
  label: string;
  tone: TagTone;
} {
  if (status === "ok") return { label: "Good standing", tone: "success" };
  if (status === "suspended") return { label: "Suspended", tone: "failure" };
  return { label: "Needs attention", tone: "failure" };
}

// The signed-in member. Avatars are round; with no photo, a monogram on the
// brand purple stands in.
export function UserCard({ user }: { user: Profile }) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  const monogram =
    `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const status = statusTag(user.accountStatus);

  return (
    <article className="flex items-center gap-4 rounded-2xl bg-surface-low p-4">
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar}
          alt={name}
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {monogram}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{name}</h3>
        <p className="truncate text-sm text-muted">{user.email}</p>
      </div>
      <Tag tone={status.tone}>{status.label}</Tag>
    </article>
  );
}
