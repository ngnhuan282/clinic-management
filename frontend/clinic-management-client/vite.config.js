import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Preserve initialization order when the billing UI modules span chunks.
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [{
            name: 'antd',
            test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-[^\\/]+)[\\/]/,
            maxSize: 300000,
          }],
        },
      },
    },
  },
})
