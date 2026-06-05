import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/admin/settings",
        destination: "/admin/settings/admins",
        permanent: false,
      },
      {
        source: "/admin/products",
        destination: "/admin/settings/products",
        permanent: true,
      },
      {
        source: "/admin/products/:path*",
        destination: "/admin/settings/products/:path*",
        permanent: true,
      },
      {
        source: "/admin/packages",
        destination: "/admin/settings/packages",
        permanent: true,
      },
      {
        source: "/admin/customers",
        destination: "/admin/settings/customers",
        permanent: true,
      },
      {
        source: "/admin/discounts",
        destination: "/admin/settings/discounts",
        permanent: true,
      },
      {
        source: "/admin/pages",
        destination: "/admin/settings/pages",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thebeanbook.org",
        pathname: "/cdn/**",
      },
    ],
  },
};

export default nextConfig;
