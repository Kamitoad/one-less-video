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
  },
});
