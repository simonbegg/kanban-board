'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
    AlertTriangle,
    CheckCircle,
    Layout,
    Archive,
    Trash2,
    Star,
    ChevronRight,
    ChevronLeft,
    Info
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase'

interface ResolveOverlimitWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    onComplete?: () => void
}

interface Board {
    id: string
    title: string
    task_count: number
    created_at: string
}

interface Task {
    id: string
    title: string
    board_id: string
    created_at: string
}

type WizardStep = 'overview' | 'choose-board' | 'delete-boards' | 'archive-tasks' | 'complete'

export function ResolveOverlimitWizard({
    open,
    onOpenChange,
    userId,
    onComplete
}: ResolveOverlimitWizardProps) {
    const [currentStep, setCurrentStep] = useState<WizardStep>('overview')
    const [loading, setLoading] = useState(false)
    const [boards, setBoards] = useState<Board[]>([])
    const [selectedPrimaryBoard, setSelectedPrimaryBoard] = useState<string | null>(null)
    const [boardsToDelete, setBoardsToDelete] = useState<string[]>([])
    const [tasksToArchive, setTasksToArchive] = useState<string[]>([])
    const [excessTasks, setExcessTasks] = useState<Task[]>([])
    const [stats, setStats] = useState({
        currentBoards: 0,
        maxBoards: 1,
        currentTasks: 0,
        maxTasks: 100,
        needToDeleteBoards: 0,
        needToArchiveTasks: 0
    })
    const supabase = createClientComponentClient<Database>()

    useEffect(() => {
        if (open) {
            loadData()
        }
    }, [open, userId])

    const loadData = async () => {
        setLoading(true)
        try {
            // Get user's entitlements
            const { data: entitlements } = await supabase
                .from('entitlements')
                .select('board_cap, active_cap_per_board')
                .eq('user_id', userId)
                .single()

            // Get all boards with task counts
            const { data: boardsData } = await supabase
                .from('boards')
                .select('id, title, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (boardsData) {
                // Count tasks for each board
                const boardsWithCounts = await Promise.all(
                    boardsData.map(async (board) => {
                        const { count } = await supabase
                            .from('tasks')
                            .select('*', { count: 'exact', head: true })
                            .eq('board_id', board.id)
                            .eq('archived', false)

                        return {
                            ...board,
                            task_count: count || 0
                        }
                    })
                )

                setBoards(boardsWithCounts)

                const maxBoards = entitlements?.board_cap || 1
                const maxTasks = entitlements?.active_cap_per_board || 100
                const needToDeleteBoards = Math.max(0, boardsWithCounts.length - maxBoards)

                setStats({
                    currentBoards: boardsWithCounts.length,
                    maxBoards,
                    currentTasks: boardsWithCounts.reduce((sum, b) => sum + b.task_count, 0),
                    maxTasks,
                    needToDeleteBoards,
                    needToArchiveTasks: 0 // Will calculate after board selection
                })
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleChoosePrimaryBoard = async (boardId: string) => {
        setSelectedPrimaryBoard(boardId)

        // Auto-select other boards for deletion
        const otherBoards = boards.filter(b => b.id !== boardId).map(b => b.id)
        setBoardsToDelete(otherBoards)

        // Check if primary board has excess tasks
        const primaryBoard = boards.find(b => b.id === boardId)
        if (primaryBoard && primaryBoard.task_count > stats.maxTasks) {
            const excess = primaryBoard.task_count - stats.maxTasks

            // Get excess tasks (oldest first)
            const { data: tasks } = await supabase
                .from('tasks')
                .select('id, title, board_id, created_at')
                .eq('board_id', boardId)
                .eq('archived', false)
                .order('created_at', { ascending: true })
                .limit(excess)

            if (tasks) {
                setExcessTasks(tasks)
                setStats(prev => ({ ...prev, needToArchiveTasks: excess }))
            }
        }
    }

    const handleDeleteBoards = async () => {
        setLoading(true)
        try {
            for (const boardId of boardsToDelete) {
                // Delete all tasks in the board first
                await supabase
                    .from('tasks')
                    .delete()
                    .eq('board_id', boardId)

                // Delete the board
                await supabase
                    .from('boards')
                    .delete()
                    .eq('id', boardId)
            }

            setCurrentStep('archive-tasks')
        } catch (error) {
            console.error('Error deleting boards:', error)
            alert('Failed to delete boards. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleArchiveTasks = async () => {
        setLoading(true)
        try {
            if (tasksToArchive.length > 0) {
                await supabase
                    .from('tasks')
                    .update({ archived: true, archived_at: new Date().toISOString() })
                    .in('id', tasksToArchive)
            }

            setCurrentStep('complete')
        } catch (error) {
            console.error('Error archiving tasks:', error)
            alert('Failed to archive tasks. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleComplete = () => {
        if (onComplete) onComplete()
        onOpenChange(false)
        // Reload page to refresh all data
        window.location.reload()
    }

    const renderOverview = () => (
        <>
            <DialogHeader>
                <DialogTitle>Resolve Over-Limit Items</DialogTitle>
                <DialogDescription>
                    Your account is over Free plan limits. Follow these steps to get back under limits.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <strong>What you need to do:</strong>
                        <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                            {stats.needToDeleteBoards > 0 && (
                                <li>Delete {stats.needToDeleteBoards} extra board{stats.needToDeleteBoards > 1 ? 's' : ''} (Free plan: 1 board)</li>
                            )}
                            {stats.needToArchiveTasks > 0 && (
                                <li>Archive {stats.needToArchiveTasks} excess task{stats.needToArchiveTasks > 1 ? 's' : ''} (Free plan: 100 active tasks per board)</li>
                            )}
                        </ul>
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Layout className="w-4 h-4" />
                                <span className="font-semibold">Boards</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.currentBoards} / {stats.maxBoards}</p>
                            <p className="text-sm text-muted-foreground">
                                {stats.needToDeleteBoards > 0 ? `Delete ${stats.needToDeleteBoards}` : 'Within limits'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-semibold">Active Tasks</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.currentTasks}</p>
                            <p className="text-sm text-muted-foreground">
                                Max {stats.maxTasks} per board
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                <Button onClick={() => setCurrentStep('choose-board')}>
                    Start Wizard
                    <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </DialogFooter>
        </>
    )

    const renderChooseBoard = () => (
        <>
            <DialogHeader>
                <DialogTitle>Choose Your Primary Board</DialogTitle>
                <DialogDescription>
                    Select the board you want to keep. All other boards will be deleted.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-900 dark:text-orange-100">
                        <strong>Warning:</strong> Deleting a board will permanently delete all tasks on that board.
                    </AlertDescription>
                </Alert>

                <RadioGroup value={selectedPrimaryBoard || ''} onValueChange={handleChoosePrimaryBoard}>
                    <div className="space-y-2">
                        {boards.map((board) => (
                            <div
                                key={board.id}
                                className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                                onClick={() => handleChoosePrimaryBoard(board.id)}
                            >
                                <RadioGroupItem value={board.id} id={board.id} />
                                <div className="flex-1">
                                    <Label htmlFor={board.id} className="cursor-pointer font-semibold">
                                        {board.title}
                                    </Label>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                        <span>{board.task_count} active tasks</span>
                                        <span>Created {new Date(board.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {board.task_count > stats.maxTasks && (
                                        <Badge variant="destructive" className="mt-2">
                                            {board.task_count - stats.maxTasks} tasks over limit
                                        </Badge>
                                    )}
                                </div>
                                {selectedPrimaryBoard === board.id && (
                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                )}
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setCurrentStep('overview')}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={() => setCurrentStep('delete-boards')}
                    disabled={!selectedPrimaryBoard}
                >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </DialogFooter>
        </>
    )

    const renderDeleteBoards = () => {
        const boardsToDeleteData = boards.filter(b => boardsToDelete.includes(b.id))

        return (
            <>
                <DialogHeader>
                    <DialogTitle>Confirm Board Deletion</DialogTitle>
                    <DialogDescription>
                        These boards will be permanently deleted, along with all their tasks.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>This action cannot be undone.</strong> All tasks on these boards will be permanently deleted.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        {boardsToDeleteData.map((board) => (
                            <div key={board.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-semibold">{board.title}</p>
                                    <p className="text-sm text-muted-foreground">{board.task_count} tasks will be deleted</p>
                                </div>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setCurrentStep('choose-board')}>
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteBoards}
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete Boards'}
                    </Button>
                </DialogFooter>
            </>
        )
    }

    const renderArchiveTasks = () => (
        <>
            <DialogHeader>
                <DialogTitle>Archive Excess Tasks</DialogTitle>
                <DialogDescription>
                    Select tasks to archive to get under the 100 active task limit.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                {excessTasks.length === 0 ? (
                    <Alert>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-900 dark:text-green-100">
                            Your board is within limits! No tasks need to be archived.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Archive {stats.needToArchiveTasks} task{stats.needToArchiveTasks > 1 ? 's' : ''} to get under the limit.
                                The oldest tasks are pre-selected.
                            </AlertDescription>
                        </Alert>

                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {excessTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center space-x-3 p-3 border rounded-lg"
                                    onClick={() => {
                                        if (tasksToArchive.includes(task.id)) {
                                            setTasksToArchive(prev => prev.filter(id => id !== task.id))
                                        } else {
                                            setTasksToArchive(prev => [...prev, task.id])
                                        }
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={tasksToArchive.includes(task.id)}
                                        onChange={() => { }}
                                        className="w-4 h-4"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Created {new Date(task.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Archive className="w-4 h-4 text-muted-foreground" />
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Selected to archive:</span>
                            <Badge>{tasksToArchive.length} / {stats.needToArchiveTasks} required</Badge>
                        </div>
                    </>
                )}
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setCurrentStep('delete-boards')}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={handleArchiveTasks}
                    disabled={loading || (excessTasks.length > 0 && tasksToArchive.length < stats.needToArchiveTasks)}
                >
                    {loading ? 'Archiving...' : excessTasks.length === 0 ? 'Continue' : 'Archive Tasks'}
                </Button>
            </DialogFooter>
        </>
    )

    const renderComplete = () => (
        <>
            <DialogHeader>
                <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <DialogTitle>All Done!</DialogTitle>
                </div>
                <DialogDescription>
                    You're now within Free plan limits.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900 dark:text-green-100">
                        <strong>Success!</strong> Your account is now compliant with Free plan limits.
                    </AlertDescription>
                </Alert>

                <div className="space-y-2">
                    {boardsToDelete.length > 0 && (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Boards deleted:</span>
                            <Badge>{boardsToDelete.length}</Badge>
                        </div>
                    )}
                    {tasksToArchive.length > 0 && (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Tasks archived:</span>
                            <Badge>{tasksToArchive.length}</Badge>
                        </div>
                    )}
                </div>

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        You can view archived tasks anytime. They'll be automatically deleted after 90 days on the Free plan.
                    </AlertDescription>
                </Alert>
            </div>

            <DialogFooter>
                <Button onClick={handleComplete}>
                    Done
                </Button>
            </DialogFooter>
        </>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                {/* Progress Indicator */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>Step {['overview', 'choose-board', 'delete-boards', 'archive-tasks', 'complete'].indexOf(currentStep) + 1} of 5</span>
                        <span>{Math.round(((['overview', 'choose-board', 'delete-boards', 'archive-tasks', 'complete'].indexOf(currentStep) + 1) / 5) * 100)}%</span>
                    </div>
                    <Progress value={((['overview', 'choose-board', 'delete-boards', 'archive-tasks', 'complete'].indexOf(currentStep) + 1) / 5) * 100} />
                </div>

                {currentStep === 'overview' && renderOverview()}
                {currentStep === 'choose-board' && renderChooseBoard()}
                {currentStep === 'delete-boards' && renderDeleteBoards()}
                {currentStep === 'archive-tasks' && renderArchiveTasks()}
                {currentStep === 'complete' && renderComplete()}
            </DialogContent>
        </Dialog>
    )
}
