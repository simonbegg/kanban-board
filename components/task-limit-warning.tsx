import { AlertCircle, Archive } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface TaskLimitWarningProps {
  currentCount: number
  limit: number
}

export function TaskLimitWarning({ currentCount, limit }: TaskLimitWarningProps) {
  if (currentCount < limit) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Task Limit Reached ({currentCount}/{limit})</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          This board has reached its maximum of {limit} active tasks.
        </p>
        <div className="flex items-start gap-2 text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20">
          <Archive className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold mb-1">To add new tasks:</p>
            <p>Archive or delete completed tasks to free up space, or create a new board using the board selector above.</p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
