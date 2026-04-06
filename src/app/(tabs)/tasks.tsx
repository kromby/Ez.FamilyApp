import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import { useSession } from '../../stores/session';
import { useTasks, useAddTask, useToggleTask, useDeleteTask } from '../../hooks/useTasks';
import { Task } from '../../lib/api';
import TaskCard from '../../components/tasks/TaskCard';
import AddTaskBar from '../../components/tasks/AddTaskBar';

export default function TasksScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { tasks, isLoading, refetch } = useTasks();
  const addTaskMutation = useAddTask();
  const toggleTaskMutation = useToggleTask();
  const deleteTaskMutation = useDeleteTask();

  const [refreshing, setRefreshing] = useState(false);
  // Track tasks recently completed — delay sort for 1s (D-02)
  const [pendingComplete, setPendingComplete] = useState<Set<string>>(new Set());
  // Track highlighted tasks from SignalR events (other users' additions)
  const [highlightedTaskIds, setHighlightedTaskIds] = useState<Set<string>>(new Set());
  const highlightTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAdd = useCallback(
    (name: string) => {
      addTaskMutation.mutate(name, {
        onError: () => {
          Alert.alert('Error', "Couldn't add task. Try again.");
        },
      });
    },
    [addTaskMutation]
  );

  const handleToggle = useCallback(
    (taskId: string, completed: boolean) => {
      if (completed) {
        // Add to pending — delay sort by 1s
        setPendingComplete((prev) => {
          const next = new Set(prev);
          next.add(taskId);
          return next;
        });
        setTimeout(() => {
          setPendingComplete((prev) => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
          });
        }, 1000);
      }
      toggleTaskMutation.mutate(
        { taskId, completed },
        {
          onError: () => {
            Alert.alert('Error', 'Failed to update task. Tap to retry.');
          },
        }
      );
    },
    [toggleTaskMutation]
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      deleteTaskMutation.mutate(taskId, {
        onError: (err) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('404')) return; // Already deleted — silent
          Alert.alert('Error', "Couldn't delete task. Try again.");
        },
      });
    },
    [deleteTaskMutation]
  );

  // Sort: active (completedAt === null) newest-first, then completed newest-completed-first
  // Tasks in pendingComplete stay in active section during delay
  const activeTasks = tasks
    .filter((t) => !t.completedAt || pendingComplete.has(t.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const completedTasks = tasks
    .filter((t) => !!t.completedAt && !pendingComplete.has(t.id))
    .sort(
      (a, b) =>
        new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    );

  const sortedTasks: Task[] = [...activeTasks, ...completedTasks];

  const styles = StyleSheet.create({
    outer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingBottom: Spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.md,
    },
    iconWrapper: {
      marginTop: Spacing['2xl'],
    },
    heading: {
      ...Typography.heading,
      color: colors.textPrimary,
      marginTop: Spacing.md,
    },
    body: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
  });

  const hasNoTasks = !isLoading && sortedTasks.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {hasNoTasks ? (
        <View style={styles.emptyContainer}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color={colors.textSecondary}
            />
          </View>
          <Text style={styles.heading}>No tasks yet</Text>
          <Text style={styles.body}>
            Add tasks to keep your family on the same page.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              currentUserId={user?.id ?? ''}
              onToggle={handleToggle}
              onDelete={handleDelete}
              isHighlighted={highlightedTaskIds.has(item.id)}
            />
          )}
        />
      )}
      <View style={{ paddingBottom: insets.bottom }}>
        <AddTaskBar onAdd={handleAdd} autoFocus={hasNoTasks} />
      </View>
    </KeyboardAvoidingView>
  );
}
