"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"


export default function ResultsHeader({ count, onDownloadCSV }) {
  return (
    <div className="flex justify-between items-center bg-gray-800 border border-gray-600 rounded-lg p-4 mt-8">
      <span className="text-gray-300">{count} Results Found</span>
      <Button
        onClick={onDownloadCSV}
        variant="outline"
        size="sm"
        className="bg-gray-700 border-white-600" 
      >
        <Download className="w-4 h-4 mr-2" />
        CSV
      </Button>
    </div>
  )
}
