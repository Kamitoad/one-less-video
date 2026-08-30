import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifestVersion: 3,
  manifest: {
    name: 'OneLessVideo',
    description:
      'Adds intentional friction before YouTube videos to interrupt mindless watching.',
    version: '1.0.0',
    permissions: ['storage'],
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      64: 'icons/icon-64.png',
      128: 'icons/icon-128.png',
      512: 'icons/icon-512.png',
    },
    action: {
      default_title: 'OneLessVideo',
      default_icon: {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png',
        64: 'icons/icon-64.png',
        128: 'icons/icon-128.png',
      },
    },
  },
});
