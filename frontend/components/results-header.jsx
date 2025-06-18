"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ResultsHeader({ count, onDownloadCSV }) {
  return (
    <div className="flex justify-between items-center bg-gray-800 border border-gray-600 rounded-lg p-4 mt-8">
      <span className="text-gray-300">{count} Results Found</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-700 border-white-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onDownloadCSV('details')}>
            Channel Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDownloadCSV('urls')}>
            Channel URLs
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
