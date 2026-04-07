interface SkeletonRowProps {
  colCount?: number
}

export function SkeletonRow({ colCount = 6 }: SkeletonRowProps) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded-md animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
        </td>
      ))}
    </tr>
  )
}
