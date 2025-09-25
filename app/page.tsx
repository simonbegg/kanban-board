import { KanbanBoard } from "@/components/kanban-board"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Project Board</h1>
          <p className="text-muted-foreground">Organize your tasks efficiently</p>
        </div>
        <KanbanBoard />
      </div>
    </main>
  )
}
