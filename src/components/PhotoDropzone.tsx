import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'

interface PhotoDropzoneProps {
  onFiles: (files: File[]) => Promise<void> | void
  disabled?: boolean
}

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

export function PhotoDropzone({ onFiles, disabled }: PhotoDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleFiles = useCallback(
    async (list: FileList | File[]) => {
      const files = Array.from(list).filter((f) => ACCEPT.includes(f.type))
      if (files.length === 0) return
      setBusy(true)
      try {
        await onFiles(files)
      } finally {
        setBusy(false)
      }
    },
    [onFiles],
  )

  return (
    <motion.label
      animate={{ scale: dragging ? 1.01 : 1 }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
        dragging
          ? 'border-sea bg-mist/40'
          : 'border-sand bg-paper/60 hover:border-sea/40 hover:bg-sand/40'
      } ${disabled || busy ? 'pointer-events-none opacity-60' : ''}`}
      onDragEnter={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        void handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <span className="font-display text-lg text-sea-deep">
        {busy ? '사진을 저장하는 중…' : '사진을 여기에 놓으세요'}
      </span>
      <span className="max-w-sm text-sm text-ink-muted">
        JPG, PNG, WebP 지원. EXIF GPS·촬영 시각을 자동으로 읽습니다.
      </span>
    </motion.label>
  )
}
