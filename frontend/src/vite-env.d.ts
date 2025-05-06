/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TENDER_MANAGER_CONTRACT_ADDRESS: string
  readonly VITE_DOCUMENT_STORE_CONTRACT_ADDRESS: string
  readonly VITE_IPFS_GATEWAY_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 