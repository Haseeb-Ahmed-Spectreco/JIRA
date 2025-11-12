/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./env.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: { appDir: true },
  redirects: async () => {
    return [
      {
        source: "/project",
        destination: "/project/backlog",
        permanent: true,
      },
      {
        source: "/",
        destination: "/project/backlog",
        permanent: true,
      },
    ];
  },
  images: {
    domains: [
      "images.clerk.dev",
      "www.gravatar.com",
      "images.unsplash.com",
      "avatars.githubusercontent.com",
      "img.clerk.com",
      "cdn-ilcaioh.nitrocdn.com",
      "platform.spectreco.com",
      "spectreco-bucket.s3.amazonaws.com",
      "res.cloudinary.com",
    ],
  },
};
export default config;
