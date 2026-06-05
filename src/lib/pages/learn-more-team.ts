import { TEAM, type TeamMember } from "@/data/team";

export type LearnMoreTeamMember = TeamMember;

export type LearnMorePageBody = {
  members: LearnMoreTeamMember[];
};

export function defaultLearnMoreTeamBody(): LearnMorePageBody {
  return {
    members: TEAM.map((member) => ({
      name: member.name,
      image: member.image ?? "",
      bio: [...member.bio],
      coffee: member.coffee ?? "",
    })),
  };
}

export function serializeLearnMoreTeam(members: LearnMoreTeamMember[]): string {
  return JSON.stringify(
    {
      members: members.map((m) => ({
        name: m.name.trim(),
        image: m.image?.trim() || undefined,
        bio: m.bio.map((p) => p.trim()).filter(Boolean),
        coffee: m.coffee?.trim() || undefined,
      })),
    },
    null,
    2,
  );
}

export function parseLearnMoreTeam(body: string): LearnMorePageBody {
  const trimmed = body.trim();
  if (!trimmed) return defaultLearnMoreTeamBody();

  try {
    const parsed = JSON.parse(trimmed) as {
      members?: LearnMoreTeamMember[];
    };
    if (Array.isArray(parsed.members) && parsed.members.length > 0) {
      return {
        members: parsed.members.map((m) => ({
          name: m.name?.trim() ?? "",
          image: m.image?.trim() || undefined,
          bio: Array.isArray(m.bio)
            ? m.bio.map((p) => String(p).trim()).filter(Boolean)
            : [],
          coffee: m.coffee?.trim() || undefined,
        })),
      };
    }
  } catch {
    // fall through
  }

  return defaultLearnMoreTeamBody();
}
