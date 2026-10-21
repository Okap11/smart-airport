/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 天地图 key */
  readonly VITE_TDT_TOKEN?: string
  /** Cesium ion token */
  readonly VITE_ION_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}
