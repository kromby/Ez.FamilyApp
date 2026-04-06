import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../stores/session';
import { useSessionStore } from '../stores/session';
import { fetchTasks, addTask, toggleTask, deleteTask, Task } from '../lib/api';

export function useTasks() {
  const { session: token } = useSession();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetchTasks(token!),
    enabled: !!token,
  });

  return { tasks: data?.tasks ?? [], isLoading, refetch };
}

export function useAddTask() {
  const { session: token } = useSession();
  const user = useSessionStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => addTask(token!, name),
    onMutate: async (name: string) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData<{ tasks: Task[] }>(['tasks']);

      const tempTask: Task = {
        id: `temp-${Date.now()}`,
        familyId: user?.familyId ?? '',
        name,
        addedById: user?.id ?? '',
        addedByName: user?.displayName ?? '',
        completedAt: null,
        completedById: null,
        completedByName: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<{ tasks: Task[] }>(['tasks'], (old) => {
        if (!old) return { tasks: [tempTask] };
        return { tasks: [tempTask, ...old.tasks] };
      });

      return { previous, tempTask };
    },
    onError: (_err, _name, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tasks'], context.previous);
      }
    },
    onSuccess: (data, name, context) => {
      // Replace temp with real task
      queryClient.setQueryData<{ tasks: Task[] }>(['tasks'], (old) => {
        if (!old) return { tasks: [data.task] };
        return {
          tasks: old.tasks.map((t) =>
            t.id === context?.tempTask.id ? data.task : t
          ),
        };
      });
    },
  });
}

export function useToggleTask() {
  const { session: token } = useSession();
  const user = useSessionStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      toggleTask(token!, taskId, completed),
    onMutate: async ({ taskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData<{ tasks: Task[] }>(['tasks']);

      queryClient.setQueryData<{ tasks: Task[] }>(['tasks'], (old) => {
        if (!old) return old;
        return {
          tasks: old.tasks.map((t) => {
            if (t.id !== taskId) return t;
            if (completed) {
              return {
                ...t,
                completedAt: new Date().toISOString(),
                completedById: user?.id ?? null,
                completedByName: user?.displayName ?? null,
              };
            } else {
              return {
                ...t,
                completedAt: null,
                completedById: null,
                completedByName: null,
              };
            }
          }),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tasks'], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ tasks: Task[] }>(['tasks'], (old) => {
        if (!old) return old;
        return {
          tasks: old.tasks.map((t) => (t.id === data.task.id ? data.task : t)),
        };
      });
    },
  });
}

export function useDeleteTask() {
  const { session: token } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(token!, taskId),
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData<{ tasks: Task[] }>(['tasks']);

      queryClient.setQueryData<{ tasks: Task[] }>(['tasks'], (old) => {
        if (!old) return old;
        return { tasks: old.tasks.filter((t) => t.id !== taskId) };
      });

      return { previous };
    },
    onError: (err, _taskId, context) => {
      // Handle 404 silently — task was already deleted
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('404')) return;
      if (context?.previous) {
        queryClient.setQueryData(['tasks'], context.previous);
      }
    },
    onSuccess: () => {
      // Already removed optimistically — no-op
    },
  });
}
