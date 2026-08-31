import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifestVersion: 3,
  vite: () => ({
    build: {
      minify: false,
    },
  }),
  manifest: {
    default_locale: 'en',
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    version: '1.0.0',
    homepage_url: 'https://github.com/Kamitoad/one-less-video',
    permissions: ['storage'],
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      64: 'icons/icon-64.png',
      128: 'icons/icon-128.png',
      512: 'icons/icon-512.png',
    },
    action: {
      default_title: '__MSG_extensionName__',
      default_icon: {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png',
        48: 'icons/icon-48.png',
        64: 'icons/icon-64.png',
        128: 'icons/icon-128.png',
      },
    },
  },
});
