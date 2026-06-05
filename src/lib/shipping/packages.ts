import type { PackagePreset } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getParcelDefaults } from "@/lib/shipping/config";

export type ParcelSpec = {
  id?: string;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightOz: number;
};

export function presetToParcel(preset: PackagePreset): ParcelSpec {
  return {
    id: preset.id,
    name: preset.name,
    lengthIn: preset.lengthIn,
    widthIn: preset.widthIn,
    heightIn: preset.heightIn,
    weightOz: preset.weightOz,
  };
}

export function envFallbackParcel(): ParcelSpec {
  const p = getParcelDefaults();
  return {
    name: "Env default (bubble mailer)",
    lengthIn: p.lengthIn,
    widthIn: p.widthIn,
    heightIn: p.heightIn,
    weightOz: p.weightOz,
  };
}

export async function listPackagePresets() {
  return prisma.packagePreset.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function getPackagePresetById(id: string) {
  return prisma.packagePreset.findUnique({ where: { id } });
}

export async function getDefaultPackagePreset() {
  const preset = await prisma.packagePreset.findFirst({
    where: { isDefault: true },
  });
  if (preset) return preset;
  return prisma.packagePreset.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

export async function resolveParcelForOrder(packageId?: string | null) {
  if (packageId) {
    const preset = await getPackagePresetById(packageId);
    if (!preset) {
      throw new Error("Package preset not found");
    }
    return presetToParcel(preset);
  }

  const defaultPreset = await getDefaultPackagePreset();
  if (defaultPreset) {
    return presetToParcel(defaultPreset);
  }

  return envFallbackParcel();
}

export function formatParcelSummary(parcel: ParcelSpec): string {
  return `${parcel.name} — ${parcel.lengthIn}×${parcel.widthIn}×${parcel.heightIn} in, ${parcel.weightOz} oz`;
}

export async function setDefaultPackagePreset(id: string) {
  await prisma.$transaction([
    prisma.packagePreset.updateMany({ data: { isDefault: false } }),
    prisma.packagePreset.update({ where: { id }, data: { isDefault: true } }),
  ]);
}
